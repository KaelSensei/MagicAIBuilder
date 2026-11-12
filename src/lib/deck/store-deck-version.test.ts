/**
 * The browser's half of the deck's optimistic lock, through the deck store:
 * every versioned write carries the deck version the store holds, adopts the
 * one the server answers, and a write refused as stale (409) rolls back,
 * reloads the deck once and tells the player what happened.
 *
 * Sociable: the store, the real deck client and the in-memory deck API run;
 * the fake answers and steps versions as the routes do (#1400).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DECK_WRITE_TIMEOUT_MS,
  type ApiDeck,
  type ApiDeckCard,
} from "@/lib/db/deck-api";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

import { useDeckStore } from "./store";

const api = installFakeDeckClient();
const toasts = recordToasts();

const DECK_ID = "deck-1";
/** The version the deck is read at in every test. */
const READ_VERSION = 7;
const CONFLICT_TOAST = { key: "deck.sync.conflictReloaded" };

/** A saved row, as `GET /api/decks/[id]` returns it. */
function apiRow(
  id: string,
  name: string,
  overrides: Partial<ApiDeckCard> = {}
): ApiDeckCard {
  return {
    id,
    deckId: DECK_ID,
    scryfallId: `${id}-printing`,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    notes: null,
    isCommander: false,
    isPartner: false,
    zone: "main",
    ...overrides,
  };
}

function scryfallCard(
  name: string,
  overrides: Partial<ScryfallCard> = {}
): ScryfallCard {
  return {
    id: `${name.toLowerCase().replaceAll(/\W+/g, "-")}-printing`,
    name,
    mana_cost: "{2}",
    cmc: 2,
    type_line: "Artifact",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "cmm",
    set_name: "Commander Masters",
    rarity: "uncommon",
    prices: { usd: null, usd_foil: null, eur: null },
    keywords: [],
    legalities: { commander: "legal" },
    ...overrides,
  };
}

const SOL_RING = apiRow("row-sol-ring", "Sol Ring");
const SIGNET = apiRow("row-signet", "Arcane Signet");
// A basic land: its quantity may grow (CR 903.5b exempts basic lands).
const ISLAND = apiRow("row-island", "Island", {
  typeLine: "Basic Land — Island",
  category: "land",
});
const RHYSTIC_STUDY = scryfallCard("Rhystic Study", {
  type_line: "Enchantment",
});
const SMOTHERING_TITHE = scryfallCard("Smothering Tithe", {
  type_line: "Enchantment",
});
const KENRITH = scryfallCard("Kenrith, the Returned King", {
  type_line: "Legendary Creature — Human Noble",
});
const SOL_RING_REPRINT = scryfallCard("Sol Ring", { id: "sol-ring-ltc" });

/** The deck as the server holds it when the tests open it. */
function serverDeck(
  cards: readonly ApiDeckCard[] = [SOL_RING, SIGNET, ISLAND]
): ApiDeck {
  return {
    ...emptyApiDeck(DECK_ID, "Artifacts"),
    version: READ_VERSION,
    cards: [...cards],
  };
}

const store = () => useDeckStore.getState();
const heldDeck = () => store().decks[DECK_ID];
const heldCardIds = () =>
  (heldDeck()?.cards ?? [])
    .map((card) => card.id)
    .sort((a, b) => a.localeCompare(b));

/** The `expectedVersion` a deck client call carried, wherever its operation takes it. */
function sentVersion(call: readonly unknown[]): number | undefined {
  const lock = call.find(
    (argument): argument is { readonly expectedVersion?: unknown } =>
      typeof argument === "object" &&
      argument !== null &&
      "expectedVersion" in argument
  );
  return typeof lock?.expectedVersion === "number"
    ? lock.expectedVersion
    : undefined;
}

/** Opens the server's deck in the store, as the builder does, then forgets the calls that took. */
async function openDeck(deck: ApiDeck = serverDeck()): Promise<void> {
  api.seedDeck(deck);
  useDeckStore.setState({
    decks: {},
    activeDeckId: null,
    undoStack: [],
    gameChangerNames: new Set(),
    bannedNames: new Set(),
  });
  await store().setActiveDeck(DECK_ID);
  vi.clearAllMocks();
}

/** Another tab saves a change: the server now holds `deck` at the next version. */
function anotherTabSaved(deck: ApiDeck): void {
  api.seedDeck({ ...deck, version: READ_VERSION + 1 });
}

beforeEach(async () => {
  localStorage.clear();
  await openDeck();
});

describe("deck store — every versioned write sends the version the deck was read at", () => {
  const WRITES = [
    {
      write: "adding a card",
      act: () => store().addCard(RHYSTIC_STUDY),
      calls: () => api.addCard.mock.calls,
    },
    {
      write: "removing a card",
      act: () => store().removeCard(SOL_RING.id),
      calls: () => api.removeCard.mock.calls,
    },
    {
      write: "changing a card's category",
      act: () => store().updateCardCategory(SOL_RING.id, "artifact"),
      calls: () => api.updateCardCategory.mock.calls,
    },
    {
      write: "changing a card's notes",
      act: () => store().updateCardNotes(SOL_RING.id, "Turn one"),
      calls: () => api.updateCardNotes.mock.calls,
    },
    {
      write: "moving a card to another zone",
      act: () => store().moveCardToZone(SOL_RING.id, "sideboard"),
      calls: () => api.updateCardZone.mock.calls,
    },
    {
      write: "changing a card's quantity",
      act: () => store().updateCardQuantity(ISLAND.id, 1),
      calls: () => api.updateCardQuantity.mock.calls,
    },
    {
      write: "swapping a card's printing",
      act: () => store().swapCardPrinting(SOL_RING.id, SOL_RING_REPRINT),
      calls: () => api.updateCardPrinting.mock.calls,
    },
    {
      write: "changing the command zone",
      act: () => store().setCommander(KENRITH),
      calls: () => api.changeCommandZone.mock.calls,
    },
    {
      write: "removing several cards",
      act: () => store().bulkRemoveCards([SOL_RING.id]),
      calls: () => api.removeCard.mock.calls,
    },
  ] as const;

  it.each(WRITES)("when $write", async ({ act, calls }) => {
    await act();

    expect(calls()).toHaveLength(1);
    expect(sentVersion(calls()[0] ?? [])).toBe(READ_VERSION);
  });

  it("when undoing a removal, with the version the removal answered", async () => {
    await store().removeCard(SOL_RING.id);

    await store().undo();

    expect(api.addCard).toHaveBeenCalledTimes(1);
    expect(sentVersion(api.addCard.mock.calls[0] ?? [])).toBe(READ_VERSION + 1);
  });

  it("adopts the version the server answers, so the next write carries it", async () => {
    await store().addCard(RHYSTIC_STUDY);
    expect(heldDeck()?.version).toBe(READ_VERSION + 1);

    await store().updateCardNotes(SOL_RING.id, "Turn one");

    expect(sentVersion(api.updateCardNotes.mock.calls[0] ?? [])).toBe(
      READ_VERSION + 1
    );
    expect(heldDeck()?.version).toBe(READ_VERSION + 2);
  });

  it("gives two writes made in quick succession consecutive versions", async () => {
    await Promise.all([
      store().addCard(RHYSTIC_STUDY),
      store().addCard(SMOTHERING_TITHE),
    ]);

    expect(api.addCard.mock.calls.map(sentVersion)).toEqual([
      READ_VERSION,
      READ_VERSION + 1,
    ]);
    expect(heldDeck()?.version).toBe(READ_VERSION + 2);
    expect(api.savedDeck(DECK_ID)?.cards.map((row) => row.name)).toEqual([
      "Sol Ring",
      "Arcane Signet",
      "Island",
      "Rhystic Study",
      "Smothering Tithe",
    ]);
  });

  it("sends consecutive versions for the rows of one bulk removal", async () => {
    await store().bulkRemoveCards([SOL_RING.id, SIGNET.id]);

    expect(api.removeCard.mock.calls.map(sentVersion)).toEqual([
      READ_VERSION,
      READ_VERSION + 1,
    ]);
    expect(heldCardIds()).toEqual([ISLAND.id]);
    expect(api.savedDeck(DECK_ID)?.cards.map((row) => row.id)).toEqual([
      ISLAND.id,
    ]);
  });
});

describe("deck store — a write the server refuses as stale", () => {
  beforeEach(() => {
    // Another tab removed Arcane Signet since this tab read the deck.
    anotherTabSaved(serverDeck([SOL_RING, ISLAND]));
  });

  it("rolls the change back, reloads the deck once and shows the conflict message instead of the failure toast", async () => {
    await store().removeCard(SOL_RING.id);

    expect(api.removeCard).toHaveBeenCalledTimes(1);
    expect(api.fetchDeck).toHaveBeenCalledTimes(1);
    // Sol Ring is back, and the deck is the one the other tab left.
    expect(heldCardIds()).toEqual([ISLAND.id, SOL_RING.id]);
    expect(heldDeck()?.version).toBe(READ_VERSION + 1);
    expect(toasts.mock.calls).toEqual([["warning", CONFLICT_TOAST]]);
    expect(store().undoStack).toEqual([]);
    expect(store().isSyncing).toBe(false);
  });

  it("reports the conflict once for a command-zone change", async () => {
    await store().setCommander(KENRITH);

    expect(api.fetchDeck).toHaveBeenCalledTimes(1);
    expect(heldDeck()?.commander).toBeNull();
    expect(toasts.mock.calls).toEqual([["warning", CONFLICT_TOAST]]);
  });

  it("drops a write queued behind the refused one: it is not sent and reports nothing more", async () => {
    await Promise.all([
      store().removeCard(SOL_RING.id),
      store().updateCardNotes(ISLAND.id, "Keep"),
    ]);

    expect(api.updateCardNotes).not.toHaveBeenCalled();
    expect(api.fetchDeck).toHaveBeenCalledTimes(1);
    expect(
      heldDeck()?.cards.find((card) => card.id === ISLAND.id)?.notes
    ).toBeNull();
    expect(toasts.mock.calls).toEqual([["warning", CONFLICT_TOAST]]);
  });

  it("sends the reloaded version with the next write", async () => {
    await store().removeCard(SOL_RING.id);
    await store().addCard(RHYSTIC_STUDY);

    expect(sentVersion(api.addCard.mock.calls[0] ?? [])).toBe(READ_VERSION + 1);
    expect(heldDeck()?.version).toBe(READ_VERSION + 2);
  });

  it("keeps the rolled-back deck and says the reload failed when it does", async () => {
    api.fetchDeck.mockRejectedValueOnce(
      new DeckApiRefusal(500, "Failed to load deck")
    );

    await store().removeCard(SOL_RING.id);

    expect(heldCardIds()).toEqual([ISLAND.id, SIGNET.id, SOL_RING.id]);
    // Nothing the store can vouch for: the version is not sent again.
    expect(heldDeck()?.version).toBeUndefined();
    expect(toasts.mock.calls).toEqual([
      ["error", "Could not refresh deck. Please retry."],
    ]);
  });

  it("the bulk edit reloads the deck and shows the conflict message, and still rejects for the dialog", async () => {
    await expect(
      store().applyBulkEdit({
        removedCardIds: [SOL_RING.id],
        quantityChanges: [],
        additions: [],
        commandZone: null,
      })
    ).rejects.toThrow("HTTP 409");

    expect(api.fetchDeck).toHaveBeenCalledTimes(1);
    expect(heldCardIds()).toEqual([ISLAND.id, SOL_RING.id]);
    expect(toasts.mock.calls).toEqual([["warning", CONFLICT_TOAST]]);
  });
});

describe("deck store — a write the server never answers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // jsdom's AbortSignal.timeout runs on the faked timers (see the Scryfall
  // client's timeout test), so the budget can be spent without waiting for it.
  it("gives up after the write budget: the change rolls back with the failure toast and the next write is sent", async () => {
    vi.useFakeTimers();
    api.removeCard.mockReturnValueOnce(new Promise(() => undefined));

    const first = store().removeCard(SOL_RING.id);
    const second = store().removeCard(SIGNET.id);
    await vi.advanceTimersByTimeAsync(DECK_WRITE_TIMEOUT_MS - 1);
    expect(api.removeCard).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() => expect(api.removeCard).toHaveBeenCalledTimes(2));
    await Promise.all([first, second]);

    // Sol Ring is back, Arcane Signet is gone, and the version is still the
    // one read: the first write saved nothing, the second carried it.
    expect(heldCardIds()).toEqual([ISLAND.id, SOL_RING.id]);
    expect(sentVersion(api.removeCard.mock.calls[1] ?? [])).toBe(READ_VERSION);
    expect(heldDeck()?.version).toBe(READ_VERSION + 1);
    expect(toasts.mock.calls).toEqual([
      ["error", "Could not remove card. Please retry."],
    ]);
    expect(store().isSyncing).toBe(false);
  });
});

describe("deck store — a version it cannot vouch for is not sent", () => {
  it("sends none for the guest deck, which keeps none", async () => {
    await store().setActiveDeck(GUEST_DECK_ID);

    await store().addCard(RHYSTIC_STUDY);
    await store().setCommander(KENRITH);

    expect(api.addCard).not.toHaveBeenCalled();
    expect(api.changeCommandZone).not.toHaveBeenCalled();
    expect(store().decks[GUEST_DECK_ID]?.version).toBeUndefined();
    expect(
      store().decks[GUEST_DECK_ID]?.cards.map((card) => card.name)
    ).toEqual(["Rhystic Study"]);
  });

  it("sends none for a deck held without a version, then adopts the one the server answers", async () => {
    const deck = heldDeck();
    if (!deck) throw new Error("the deck was not opened");
    useDeckStore.setState({
      decks: { [DECK_ID]: { ...deck, version: undefined } },
    });

    await store().addCard(RHYSTIC_STUDY);

    expect(sentVersion(api.addCard.mock.calls[0] ?? [])).toBeUndefined();
    expect(heldDeck()?.version).toBe(READ_VERSION + 1);
  });
});
