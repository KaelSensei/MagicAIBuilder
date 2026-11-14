/**
 * Unit tests for core deck store actions.
 *
 * Covers: setGameChangerNames, setBannedNames, setSearchViewMode,
 * setDeckViewMode, setActiveDeck, loadDecks, createDeck, deleteDeck,
 * renameDeck, getActiveDeck, setTargetBracket, setBudget, setManualBracket,
 * addCard, removeCard, updateCardCategory.
 *
 * The fake deck API (`src/test/fake-deck-client.ts`) answers every deck
 * request in memory, so the tests run offline.
 */

import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import type { Mock } from "vitest";

const collectionState = vi.hoisted(() => ({
  collectionCards: {} as Record<string, { name: string; quantity: number; scryfallId: string }>,
  collectionCardsFoil: {} as Record<string, { name: string; quantity: number; scryfallId: string }>,
}));

vi.mock("@/lib/collection/store", () => ({
  useCollectionStore: { getState: () => collectionState },
}));

vi.mock(import("@/lib/scryfall/client"), () => ({
  getCardById: vi.fn(),
}));

import type { ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import * as scryfallClient from "@/lib/scryfall/client";
import type { Deck, DeckCard, CardCategory } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

// Import the store AFTER mocks are set up
const { useDeckStore } = await import("@/lib/deck/store");

const deckApi = installFakeDeckClient();
const toastAdd = recordToasts();

/** The deck every create in this file answers, whatever its name. */
const CREATED_DECK: ApiDeck = {
  id: "deck-1",
  name: "Test Deck",
  format: "commander",
  targetBracket: 2,
  manualBracket: null,
  budget: null,
  description: "",
  tags: [],
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  isAIGenerated: false,
  commanderId: null,
  commanderName: null,
  partnerId: null,
  companionId: null,
  pairingType: "none",
  companion: null,
  maybeboard: [],
  cards: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** The row every add in this file answers, whatever card was added. */
const SAVED_ROW: ApiDeckCard = {
  id: "saved-db-id",
  deckId: "deck-1",
  scryfallId: "scryfall-id-1",
  name: "Lightning Bolt",
  manaCost: "{R}",
  cmc: 1,
  typeLine: "Instant",
  oracleText: "Deal 3 damage.",
  colorIdentity: ["R"],
  isGameChanger: false,
  isBanned: false,
  price: null,
  imageUri: "",
  artCropUri: "",
  category: "instant",
  quantity: 1,
  isCommander: false,
  isPartner: false,
  zone: "main",
};

beforeEach(() => {
  deckApi.createDeck.mockResolvedValue(CREATED_DECK);
  deckApi.addCard.mockResolvedValue(SAVED_ROW);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeActiveDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeScryfallCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "scryfall-id-1",
    name: "Lightning Bolt",
    mana_cost: "{R}",
    cmc: 1,
    type_line: "Instant",
    oracle_text: "Deal 3 damage.",
    color_identity: ["R"],
    colors: ["R"],
    set: "lea",
    set_name: "Limited Edition Alpha",
    rarity: "common",
    prices: { usd: "1.00", usd_foil: null, eur: null },
    image_uris: { small: "", normal: "", large: "", art_crop: "", border_crop: "", png: "" },
    card_faces: undefined,
    keywords: [],
    legalities: { commander: "legal" },
    ...overrides,
  };
}

function makeDeckCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card-1",
    name: "Counterspell",
    manaCost: "{U}{U}",
    cmc: 2,
    typeLine: "Instant",
    oracleText: "Counter target spell.",
    colorIdentity: ["U"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

/** Seed the store with one active deck, bypassing async loadDecks. */
function seedDeck(deck: Deck = makeActiveDeck()): void {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
    gameChangerNames: new Set<string>(),
    bannedNames: new Set<string>(),
    undoStack: [],
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("addCard quantity save completion", () => {
  it("waits for an existing card quantity save before completing", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard({ name: "Relentless Rats" })] }));
    const pending = Promise.withResolvers<void>();
    const update = vi.spyOn(useDeckStore.getState(), "updateCardQuantity").mockReturnValueOnce(pending.promise);
    let completed = false;
    const addition = useDeckStore.getState().addCard(makeScryfallCard({ name: "Relentless Rats", oracle_text: "A deck can have any number of cards named Relentless Rats." }))
      .then(() => { completed = true; });
    try {
      await vi.waitFor(() => expect(update).toHaveBeenCalled());
      expect(completed).toBe(false);
    } finally {
      pending.resolve();
      await addition;
      update.mockRestore();
    }
  });
});

describe("addCard and removeCard sync overlap", () => {
  // The two writes go to one deck, so the second waits for the first's answer
  // and carries the version it brings (`deck-write-queue.ts`). The removal is
  // sent first: the addition looks for an owned printing before it is queued.
  it("stays syncing while the addition waits for the removal, and until both settle", async () => {
    vi.clearAllMocks();
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
    const pendingAddition = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.addCard>>>();
    const pendingRemoval = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.removeCard>>>();
    vi.mocked(deckApi.addCard).mockReturnValueOnce(pendingAddition.promise);
    vi.mocked(deckApi.removeCard).mockReturnValueOnce(pendingRemoval.promise);

    const addition = useDeckStore.getState().addCard(makeScryfallCard());
    const removal = useDeckStore.getState().removeCard("card-1");
    await vi.waitFor(() => expect(deckApi.removeCard).toHaveBeenCalledOnce());
    expect(useDeckStore.getState().isSyncing).toBe(true);
    expect(deckApi.addCard).not.toHaveBeenCalled();

    pendingRemoval.resolve({});
    await removal;
    await vi.waitFor(() => expect(deckApi.addCard).toHaveBeenCalledOnce());
    expect(useDeckStore.getState().isSyncing).toBe(true);

    pendingAddition.resolve({
      ...makeDeckCard({ id: "saved-db-id", name: "Lightning Bolt" }),
      deckId: "deck-1",
      scryfallId: "scryfall-id-1",
      isCommander: false,
      isPartner: false,
    });
    await addition;
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

describe("useDeckStore — bulkRemoveCards recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  collectionState.collectionCards = {};
  collectionState.collectionCardsFoil = {};
    seedDeck();
  });
  it("keeps bulk removal activity after a manual bracket save finishes", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
    const pending = Promise.withResolvers<void>();
    vi.mocked(deckApi.removeCard).mockReturnValueOnce(pending.promise);
    const removal = useDeckStore.getState().bulkRemoveCards(["card-1"]);
    await useDeckStore.getState().setManualBracket(3);
    expect(useDeckStore.getState().isSyncing).toBe(true);
    pending.resolve();
    await removal;
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("keeps manual bracket activity after a bulk removal finishes", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const manualSave = useDeckStore.getState().setManualBracket(3);
    await useDeckStore.getState().bulkRemoveCards(["card-1"]);
    expect(useDeckStore.getState().isSyncing).toBe(true);
    pending.resolve(await deckApi.createDeck("Test Deck"));
    await manualSave;
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("keeps syncing until all overlapping bulk removals finish", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard({ id: "first" }), makeDeckCard({ id: "second" })] }));
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.removeCard>>>();
    vi.mocked(deckApi.removeCard).mockReturnValueOnce(pending.promise);
    const firstBatch = useDeckStore.getState().bulkRemoveCards(["first"]);
    // The second batch waits for the first's answer: one deck, one write at a time.
    const secondBatch = useDeckStore.getState().bulkRemoveCards(["second"]);
    await vi.waitFor(() => expect(deckApi.removeCard).toHaveBeenCalledOnce());
    expect(useDeckStore.getState().isSyncing).toBe(true);
    pending.resolve({});
    await Promise.all([firstBatch, secondBatch]);
    expect(deckApi.removeCard).toHaveBeenCalledTimes(2);
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("leaves the deck and activity unchanged for an entirely stale selection", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
    const deck = useDeckStore.getState().decks["deck-1"];
    await useDeckStore.getState().bulkRemoveCards(["missing"]);
    expect(deckApi.removeCard).not.toHaveBeenCalled();
    expect(useDeckStore.getState().decks["deck-1"]).toBe(deck);
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("does not send removal requests for cards absent from the active deck", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
    await useDeckStore.getState().bulkRemoveCards(["missing", "card-1"]);
    expect(deckApi.removeCard).toHaveBeenCalledExactlyOnceWith({ deckId: "deck-1" }, "card-1");
    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([]);
  });

  it("sends only one removal request for a repeated card identifier", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
    await useDeckStore.getState().bulkRemoveCards(["card-1", "card-1"]);
    expect(deckApi.removeCard).toHaveBeenCalledExactlyOnceWith({ deckId: "deck-1" }, "card-1");
    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([]);
  });

  it("shows one retry notification for multiple rejected removals", async () => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard({ id: "first" }), makeDeckCard({ id: "second" })] }));
    vi.mocked(deckApi.removeCard)
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"));
    await useDeckStore.getState().bulkRemoveCards(["first", "second"]);
    expect(useDeckStore.getState().decks["deck-1"].cards.map((card) => card.id)).toEqual(["first", "second"]);
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith("error", "Could not remove card. Please retry.");
  });

  it("preserves original order when the removals are rejected one after the other", async () => {
    // One deck, one write at a time: the second removal is sent once the
    // first has settled, so the rows come back in the order they left.
    const first = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.removeCard>>>();
    const second = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.removeCard>>>();
    const cards = ["first", "second", "removed", "last"].map((id) => makeDeckCard({ id }));
    seedDeck(makeActiveDeck({ cards }));
    vi.mocked(deckApi.removeCard).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const removal = useDeckStore.getState().bulkRemoveCards(["first", "second", "removed"]);
    await vi.waitFor(() => expect(deckApi.removeCard).toHaveBeenCalledOnce());
    first.reject(new Error("offline"));
    await vi.waitFor(() => expect(deckApi.removeCard).toHaveBeenCalledTimes(2));
    second.reject(new Error("offline"));
    await removal;
    expect(useDeckStore.getState().decks["deck-1"].cards.map((card) => card.id)).toEqual([
      "first", "second", "last",
    ]);
  });

  it("restores a rejected bulk removal before its surviving successor", async () => {
    const first = makeDeckCard({ id: "first" });
    const middle = makeDeckCard({ id: "middle" });
    const last = makeDeckCard({ id: "last" });
    seedDeck(makeActiveDeck({ cards: [first, middle, last] }));
    vi.mocked(deckApi.removeCard).mockRejectedValueOnce(new Error("offline"));
    await useDeckStore.getState().bulkRemoveCards(["middle"]);
    expect(useDeckStore.getState().decks["deck-1"].cards.map((card) => card.id)).toEqual([
      "first", "middle", "last",
    ]);
  });

  it("does not recreate a deleted deck after a rejected bulk removal", async () => {
    const pending = Promise.withResolvers<void>();
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
    vi.mocked(deckApi.removeCard).mockReturnValueOnce(pending.promise);
    const removal = useDeckStore.getState().bulkRemoveCards(["card-1"]);
    await useDeckStore.getState().deleteDeck("deck-1");
    pending.reject(new Error("offline"));
    await removal;
    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("restores a rejected removal without restoring successful removals", async () => {
    const rejected = makeDeckCard({ id: "rejected", zone: "sideboard", quantity: 3, isMaybeboard: false });
    const removed = makeDeckCard({ id: "removed" });
    seedDeck(makeActiveDeck({ cards: [rejected, removed] }));
    vi.mocked(deckApi.removeCard).mockRejectedValueOnce(new Error("offline"));
    await useDeckStore.getState().bulkRemoveCards(["rejected", "removed"]);
    expect(useDeckStore.getState().decks["deck-1"].cards).toEqual([rejected]);
    expect(toastAdd).toHaveBeenCalledWith("error", "Could not remove card. Please retry.");
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

describe("useDeckStore — setGameChangerNames / setBannedNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("setGameChangerNames stores the provided set", () => {
    const names = new Set(["Rhystic Study", "Smothering Tithe"]);
    useDeckStore.getState().setGameChangerNames(names);
    expect(useDeckStore.getState().gameChangerNames).toBe(names);
    expect(useDeckStore.getState().gameChangerNames.has("Rhystic Study")).toBe(true);
  });

  it("setGameChangerNames replaces the previous set", () => {
    useDeckStore.getState().setGameChangerNames(new Set(["Old Card"]));
    useDeckStore.getState().setGameChangerNames(new Set(["New Card"]));
    expect(useDeckStore.getState().gameChangerNames.has("Old Card")).toBe(false);
    expect(useDeckStore.getState().gameChangerNames.has("New Card")).toBe(true);
  });

  it("does not publish another update when synchronized game changer names are unchanged", () => {
    const listener = vi.fn();
    const unsubscribe = useDeckStore.subscribe(listener);

    useDeckStore.getState().setGameChangerNames(new Set(["Rhystic Study"]));
    useDeckStore.getState().setGameChangerNames(new Set(["Rhystic Study"]));

    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("setBannedNames stores the provided set", () => {
    const names = new Set(["Emrakul, the Aeons Torn"]);
    useDeckStore.getState().setBannedNames(names);
    expect(useDeckStore.getState().bannedNames.has("Emrakul, the Aeons Torn")).toBe(true);
  });

  it("setBannedNames replaces the previous set", () => {
    useDeckStore.getState().setBannedNames(new Set(["Card A"]));
    useDeckStore.getState().setBannedNames(new Set(["Card B"]));
    expect(useDeckStore.getState().bannedNames.has("Card A")).toBe(false);
    expect(useDeckStore.getState().bannedNames.has("Card B")).toBe(true);
  });

  it("does not publish another update when synchronized banned names are unchanged", () => {
    const listener = vi.fn();
    const unsubscribe = useDeckStore.subscribe(listener);

    useDeckStore.getState().setBannedNames(new Set(["Flash"]));
    useDeckStore.getState().setBannedNames(new Set(["Flash"]));

    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — setSearchViewMode / setDeckViewMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("setSearchViewMode switches to list", () => {
    useDeckStore.getState().setSearchViewMode("list");
    expect(useDeckStore.getState().searchViewMode).toBe("list");
  });

  it("setSearchViewMode switches back to grid", () => {
    useDeckStore.getState().setSearchViewMode("list");
    useDeckStore.getState().setSearchViewMode("grid");
    expect(useDeckStore.getState().searchViewMode).toBe("grid");
  });

  it("starts deck editing in grid view", () => {
    expect(useDeckStore.getInitialState().deckViewMode).toBe("grid");
  });

  it("setDeckViewMode switches to grid", () => {
    useDeckStore.getState().setDeckViewMode("grid");
    expect(useDeckStore.getState().deckViewMode).toBe("grid");
  });

  it("setDeckViewMode switches back to list", () => {
    useDeckStore.getState().setDeckViewMode("grid");
    useDeckStore.getState().setDeckViewMode("list");
    expect(useDeckStore.getState().deckViewMode).toBe("list");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — setActiveDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const deck1 = makeActiveDeck({ id: "deck-1", name: "Deck One" });
    const deck2 = makeActiveDeck({ id: "deck-2", name: "Deck Two" });
    useDeckStore.setState({
      decks: { "deck-1": deck1, "deck-2": deck2 },
      activeDeckId: "deck-1",
      isSyncing: false,
    });
  });

  it("sets the active deck id", () => {
    useDeckStore.getState().setActiveDeck("deck-2");
    expect(useDeckStore.getState().activeDeckId).toBe("deck-2");
  });

  it("switching active deck does not mutate existing decks", () => {
    useDeckStore.getState().setActiveDeck("deck-2");
    expect(useDeckStore.getState().decks["deck-1"].name).toBe("Deck One");
    expect(useDeckStore.getState().decks["deck-2"].name).toBe("Deck Two");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — getActiveDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("returns the active deck when activeDeckId is set", () => {
    const deck = useDeckStore.getState().getActiveDeck();
    expect(deck).not.toBeNull();
    expect(deck?.id).toBe("deck-1");
  });

  it("returns null when activeDeckId is null", () => {
    useDeckStore.setState({ activeDeckId: null });
    expect(useDeckStore.getState().getActiveDeck()).toBeNull();
  });

  it("returns null when activeDeckId points to non-existent deck", () => {
    useDeckStore.setState({ activeDeckId: "nonexistent-id" });
    expect(useDeckStore.getState().getActiveDeck()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — loadDecks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDeckStore.setState({ decks: {}, activeDeckId: null, isSyncing: false });
  });

  it("populates the decks map from the API response", async () => {
    (deckApi.fetchDecks as Mock).mockResolvedValueOnce({
      decks: [
        {
          id: "api-deck-1",
          name: "Loaded Deck",
          format: "commander",
          targetBracket: 2,
          manualBracket: null,
          budget: null,
          description: "Loaded from API",
          tags: ["casual"],
          shareToken: null,
          shareEnabled: false,
          isPublic: false,
          isAIGenerated: false,
          commanderId: null,
          partnerId: null,
          companionId: null,
          pairingType: "none",
          cards: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 0,
      limit: 20,
    });
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().decks["api-deck-1"]).toBeDefined();
    expect(useDeckStore.getState().decks["api-deck-1"].name).toBe("Loaded Deck");
  });

  it("sets isSyncing to false after successful load", async () => {
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("sets isSyncing to false even when API throws", async () => {
    (deckApi.fetchDecks as Mock).mockRejectedValueOnce(new Error("network error"));
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("replaces existing decks with the API result", async () => {
    useDeckStore.setState({ decks: { "old-deck": makeActiveDeck({ id: "old-deck" }) } });
    (deckApi.fetchDecks as Mock).mockResolvedValueOnce({ decks: [], total: 0, page: 0, limit: 20 });
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().decks["old-deck"]).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — createDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDeckStore.setState({ decks: {}, activeDeckId: null, isSyncing: false });
  });

  it("adds the new deck to the store and returns its id", async () => {
    const id = await useDeckStore.getState().createDeck("My New Deck");
    expect(id).toBe("deck-1");
    expect(useDeckStore.getState().decks["deck-1"]).toBeDefined();
  });

  it("sets the new deck as the active deck", async () => {
    await useDeckStore.getState().createDeck("Active Deck");
    expect(useDeckStore.getState().activeDeckId).toBe("deck-1");
  });

  it("calls the API with the deck name", async () => {
    await useDeckStore.getState().createDeck("My New Deck");
    expect(deckApi.createDeck).toHaveBeenCalledWith("My New Deck", { isAIGenerated: undefined });
  });

  it("reuses the local guest deck instead of creating an authenticated deck", async () => {
    useDeckStore.setState({ activeDeckId: GUEST_DECK_ID });

    const id = await useDeckStore.getState().createDeck("New Deck");

    expect(id).toBe(GUEST_DECK_ID);
    expect(deckApi.createDeck).not.toHaveBeenCalled();
    expect(useDeckStore.getState().decks[GUEST_DECK_ID]).toBeDefined();
  });

  it("sets isSyncing to false after completion", async () => {
    await useDeckStore.getState().createDeck("Test");
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — deleteDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("removes the deck from the store", async () => {
    await useDeckStore.getState().deleteDeck("deck-1");
    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
  });

  it("clears activeDeckId when the active deck is deleted", async () => {
    await useDeckStore.getState().deleteDeck("deck-1");
    expect(useDeckStore.getState().activeDeckId).toBeNull();
  });

  it("does not clear activeDeckId when a different deck is deleted", async () => {
    const deck2 = makeActiveDeck({ id: "deck-2", name: "Deck Two" });
    useDeckStore.setState((state) => ({
      decks: { ...state.decks, "deck-2": deck2 },
      activeDeckId: "deck-1",
    }));
    await useDeckStore.getState().deleteDeck("deck-2");
    expect(useDeckStore.getState().activeDeckId).toBe("deck-1");
  });

  it("calls the API with the correct deck id", async () => {
    await useDeckStore.getState().deleteDeck("deck-1");
    expect(deckApi.deleteDeck).toHaveBeenCalledWith("deck-1");
  });

  it("sets isSyncing to false after completion", async () => {
    await useDeckStore.getState().deleteDeck("deck-1");
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — renameDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("updates the deck name optimistically", async () => {
    await useDeckStore.getState().renameDeck("deck-1", "Renamed Deck");
    expect(useDeckStore.getState().decks["deck-1"].name).toBe("Renamed Deck");
  });

  it("calls the API with the new name", async () => {
    await useDeckStore.getState().renameDeck("deck-1", "Renamed Deck");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { name: "Renamed Deck" });
  });

  it("restores the previous name when its save fails", async () => {
    (deckApi.updateDeck as Mock).mockRejectedValueOnce(new Error("server error"));
    await useDeckStore.getState().renameDeck("deck-1", "New Name");
    expect(useDeckStore.getState().decks["deck-1"].name).toBe("Test Deck");
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith("error", "Could not rename deck. Please retry.");
  });

  it("preserves a newer successful name when an older rename fails", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const olderRename = useDeckStore.getState().renameDeck("deck-1", "Older Name");
    await useDeckStore.getState().renameDeck("deck-1", "Latest Name");
    pending.reject(new Error("offline"));
    await olderRename;

    expect(useDeckStore.getState().decks["deck-1"].name).toBe("Latest Name");
  });

  it("preserves a newer successful rename to the same name when an older save fails", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const olderRename = useDeckStore.getState().renameDeck("deck-1", "Shared Name");
    await useDeckStore.getState().renameDeck("deck-1", "Shared Name");
    pending.reject(new Error("offline"));
    await olderRename;

    expect(useDeckStore.getState().decks["deck-1"].name).toBe("Shared Name");
  });

  it("keeps the save indicator visible until overlapping renames finish", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);

    const firstRename = useDeckStore.getState().renameDeck("deck-1", "First Name");
    await useDeckStore.getState().renameDeck("deck-1", "Second Name");

    expect(useDeckStore.getState().isSyncing).toBe(true);

    pending.resolve(await deckApi.createDeck("Test Deck"));
    await firstRename;

    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("does not recreate a deleted deck or warn when its rename fails late", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const rename = useDeckStore.getState().renameDeck("deck-1", "New Name");
    await useDeckStore.getState().deleteDeck("deck-1");
    pending.reject(new Error("offline"));
    await rename;

    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(toastAdd).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — setTargetBracket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });
  it("preserves a different newer target when an older save fails", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const olderSave = useDeckStore.getState().setTargetBracket(4);
    await useDeckStore.getState().setTargetBracket(3);
    pending.reject(new Error("offline"));
    await olderSave;
    expect(useDeckStore.getState().decks["deck-1"].targetBracket).toBe(3);
  });

  it("does not recreate or warn about a deleted deck after a late failure", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const save = useDeckStore.getState().setTargetBracket(4);
    await useDeckStore.getState().deleteDeck("deck-1");
    pending.reject(new Error("offline"));
    await save;
    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("restores the previous target bracket when saving fails", async () => {
    vi.mocked(deckApi.updateDeck).mockRejectedValueOnce(new Error("offline"));
    await useDeckStore.getState().setTargetBracket(4);
    expect(useDeckStore.getState().decks["deck-1"].targetBracket).toBe(2);
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith("error", "Could not save target bracket. Please retry.");
  });

  it("updates targetBracket optimistically", async () => {
    await useDeckStore.getState().setTargetBracket(4);
    expect(useDeckStore.getState().decks["deck-1"].targetBracket).toBe(4);
  });

  it("calls the API with the correct bracket value", async () => {
    await useDeckStore.getState().setTargetBracket(3);
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { targetBracket: 3 });
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().setTargetBracket(4);
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — setBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("keeps the save indicator visible while a rename remains pending", async () => {
    const pendingRename = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pendingRename.promise);

    const rename = useDeckStore.getState().renameDeck("deck-1", "Renamed Deck");
    await useDeckStore.getState().setBudget(100);

    expect(useDeckStore.getState().isSyncing).toBe(true);

    pendingRename.resolve(await deckApi.createDeck("Test Deck"));
    await rename;

    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("keeps syncing after a rejected save until the other budget save finishes", async () => {
    const savedDeck = await deckApi.createDeck("Test Deck");
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    (deckApi.updateDeck as Mock)
      .mockRejectedValueOnce(new Error("offline"))
      .mockReturnValueOnce(pending.promise);

    const first = useDeckStore.getState().setBudget(100);
    const second = useDeckStore.getState().setBudget(200);
    await first;

    expect(useDeckStore.getState().isSyncing).toBe(true);
    pending.resolve(savedDeck);
    await second;
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("updates budget optimistically", async () => {
    await useDeckStore.getState().setBudget(500);
    expect(useDeckStore.getState().decks["deck-1"].budget).toBe(500);
  });

  it("clears budget when null is passed", async () => {
    seedDeck(makeActiveDeck({ budget: 200 }));
    await useDeckStore.getState().setBudget(null);
    expect(useDeckStore.getState().decks["deck-1"].budget).toBeNull();
  });

  it("calls the API with the correct budget value", async () => {
    await useDeckStore.getState().setBudget(100);
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { budget: 100 });
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().setBudget(100);
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — setManualBracket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });
  it("keeps syncing after a rejected save until the other request finishes", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const firstSave = useDeckStore.getState().setManualBracket(4);
    vi.mocked(deckApi.updateDeck).mockRejectedValueOnce(new Error("offline"));
    await useDeckStore.getState().setManualBracket(3);
    expect(useDeckStore.getState().isSyncing).toBe(true);
    pending.resolve(await deckApi.createDeck("Test Deck"));
    await firstSave;
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("keeps syncing while another manual bracket save is pending", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const firstSave = useDeckStore.getState().setManualBracket(4);
    await useDeckStore.getState().setManualBracket(3);
    expect(useDeckStore.getState().isSyncing).toBe(true);
    pending.resolve(await deckApi.createDeck("Test Deck"));
    await firstSave;
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("preserves a newer manual bracket when an older save fails", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const olderSave = useDeckStore.getState().setManualBracket(4);
    await useDeckStore.getState().setManualBracket(3);
    pending.reject(new Error("offline"));
    await olderSave;
    expect(useDeckStore.getState().decks["deck-1"].manualBracket).toBe(3);
  });

  it("does not recreate or notify about a deleted deck after a failed save", async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    const save = useDeckStore.getState().setManualBracket(4);
    await useDeckStore.getState().deleteDeck("deck-1");
    pending.reject(new Error("offline"));
    await save;
    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("restores the previous override when clearing it fails", async () => {
    seedDeck(makeActiveDeck({ manualBracket: 2 }));
    vi.mocked(deckApi.updateDeck).mockRejectedValueOnce(new Error("offline"));
    await useDeckStore.getState().setManualBracket(null);
    expect(useDeckStore.getState().decks["deck-1"].manualBracket).toBe(2);
  });

  it("restores automatic calculation when saving a manual bracket fails", async () => {
    vi.mocked(deckApi.updateDeck).mockRejectedValueOnce(new Error("offline"));
    await useDeckStore.getState().setManualBracket(4);
    expect(useDeckStore.getState().decks["deck-1"].manualBracket).toBeNull();
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith("error", "Could not save manual bracket. Please retry.");
  });

  it("sets manualBracket optimistically", async () => {
    await useDeckStore.getState().setManualBracket(3);
    expect(useDeckStore.getState().decks["deck-1"].manualBracket).toBe(3);
  });

  it("clears manualBracket when null is passed", async () => {
    seedDeck(makeActiveDeck({ manualBracket: 2 }));
    await useDeckStore.getState().setManualBracket(null);
    expect(useDeckStore.getState().decks["deck-1"].manualBracket).toBeNull();
  });

  it("calls the API with the correct value", async () => {
    await useDeckStore.getState().setManualBracket(4);
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { manualBracket: 4 });
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().setManualBracket(2);
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — addCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
  });

  it("prefers an owned printing with the same name without changing the collection", async () => {
    const searchedCard = makeScryfallCard({ id: "searched-printing", name: "Lightning Bolt" });
    const ownedPrinting = makeScryfallCard({ id: "owned-printing", name: "Lightning Bolt" });
    collectionState.collectionCards = {
      "owned-printing": { name: "Lightning Bolt", quantity: 1, scryfallId: "owned-printing" },
    };
    vi.mocked(scryfallClient.getCardById).mockResolvedValueOnce(ownedPrinting);
    seedDeck();

    await useDeckStore.getState().addCard(searchedCard);

    expect(scryfallClient.getCardById).toHaveBeenCalledWith("owned-printing");
    expect(deckApi.addCard).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      expect.objectContaining({ scryfallId: "owned-printing" })
    );
    expect(collectionState.collectionCards["owned-printing"]?.quantity).toBe(1);
  });

  it("prefers an owned printing when an imported deck card is added", async () => {
    const ownedPrinting = makeScryfallCard({ id: "owned-printing", name: "Lightning Bolt" });
    collectionState.collectionCards = {
      "owned-printing": { name: "Lightning Bolt", quantity: 1, scryfallId: "owned-printing" },
    };
    vi.mocked(scryfallClient.getCardById).mockResolvedValueOnce(ownedPrinting);
    seedDeck();

    await useDeckStore.getState().addDeckCard(
      makeDeckCard({ id: "imported-printing", scryfallId: "imported-printing", name: "Lightning Bolt" })
    );

    expect(scryfallClient.getCardById).toHaveBeenCalledWith("owned-printing");
    expect(deckApi.addCard).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      expect.objectContaining({ scryfallId: "owned-printing" })
    );
    expect(collectionState.collectionCards["owned-printing"]?.quantity).toBe(1);
  });

  // I-57 defect 1: the printing selector's pick was swapped for any other owned printing.
  it("keeps the printing the player picked even when they own another printing of that card", async () => {
    onTestFinished(() => {
      vi.mocked(scryfallClient.getCardById).mockReset();
      collectionState.collectionCards = {};
    });
    const pickedPrinting = makeScryfallCard({ id: "picked-printing", name: "Lightning Bolt" });
    collectionState.collectionCards = {
      "owned-printing": { name: "Lightning Bolt", quantity: 1, scryfallId: "owned-printing" },
    };
    vi.mocked(scryfallClient.getCardById).mockResolvedValue(
      makeScryfallCard({ id: "owned-printing", name: "Lightning Bolt" })
    );

    await useDeckStore.getState().addCard(pickedPrinting, { printing: "explicit" });

    expect(deckApi.addCard).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      expect.objectContaining({ scryfallId: "picked-printing" })
    );
  });

  it("adds a new card to the deck", async () => {
    const card = makeScryfallCard();
    await useDeckStore.getState().addCard(card);
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(1);
    expect(useDeckStore.getState().decks["deck-1"].cards[0].name).toBe("Lightning Bolt");
  });

  it("removes a failed addition and lets the player retry", async () => {
    vi.mocked(deckApi.addCard).mockRejectedValueOnce(new Error("offline"));
    const card = makeScryfallCard();

    await useDeckStore.getState().addCard(card);

    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(0);
    expect(toastAdd).toHaveBeenCalledWith("error", "Could not add card. Please retry.");
    await useDeckStore.getState().addCard(card);
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(1);
  });

  it("updates the card id to the DB-saved id after API call", async () => {
    const card = makeScryfallCard();
    await useDeckStore.getState().addCard(card);
    const savedCard = useDeckStore.getState().decks["deck-1"].cards[0];
    expect(savedCard.id).toBe("saved-db-id");
  });

  it("marks a card as game changer when its name is in gameChangerNames", async () => {
    useDeckStore.setState({ gameChangerNames: new Set(["Lightning Bolt"]) });
    const card = makeScryfallCard({ name: "Lightning Bolt" });
    await useDeckStore.getState().addCard(card);
    const addedCard = useDeckStore.getState().decks["deck-1"].cards[0];
    expect(addedCard.isGameChanger).toBe(true);
  });

  it("marks a card as banned when its name is in bannedNames", async () => {
    useDeckStore.setState({ bannedNames: new Set(["Lightning Bolt"]) });
    const card = makeScryfallCard({ name: "Lightning Bolt" });
    await useDeckStore.getState().addCard(card);
    const addedCard = useDeckStore.getState().decks["deck-1"].cards[0];
    expect(addedCard.isBanned).toBe(true);
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    const card = makeScryfallCard();
    await useDeckStore.getState().addCard(card);
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });

  it("calls the API with correct card data", async () => {
    const card = makeScryfallCard();
    await useDeckStore.getState().addCard(card);
    expect(deckApi.addCard).toHaveBeenCalledWith(
      { deckId: "deck-1" },
      expect.objectContaining({
        name: "Lightning Bolt",
        isCommander: false,
        isPartner: false,
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — removeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
  });

  it("removes the card from the deck", async () => {
    await useDeckStore.getState().removeCard("card-1");
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(0);
  });

  it("calls the API with deck id and card id", async () => {
    await useDeckStore.getState().removeCard("card-1");
    expect(deckApi.removeCard).toHaveBeenCalledWith({ deckId: "deck-1" }, "card-1");
  });

  it("adds removed card to undo stack", async () => {
    await useDeckStore.getState().removeCard("card-1");
    const { undoStack } = useDeckStore.getState();
    expect(undoStack).toHaveLength(1);
    expect(undoStack[0].type).toBe("REMOVE_CARD");
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().removeCard("card-1");
    expect(deckApi.removeCard).not.toHaveBeenCalled();
  });

  it("does not affect other cards when removing by id", async () => {
    const card2 = makeDeckCard({ id: "card-2", name: "Force of Will" });
    useDeckStore.setState((state) => ({
      decks: {
        ...state.decks,
        "deck-1": { ...state.decks["deck-1"], cards: [makeDeckCard(), card2] },
      },
    }));
    await useDeckStore.getState().removeCard("card-1");
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(1);
    expect(useDeckStore.getState().decks["deck-1"].cards[0].name).toBe("Force of Will");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — updateCardCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck(makeActiveDeck({ cards: [makeDeckCard()] }));
  });

  it("updates the category optimistically", async () => {
    await useDeckStore.getState().updateCardCategory("card-1", "removal");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.category).toBe("removal");
  });

  it("calls the API with deck id, card id, and new category", async () => {
    const category: CardCategory = "draw";
    await useDeckStore.getState().updateCardCategory("card-1", category);
    expect(deckApi.updateCardCategory).toHaveBeenCalledWith({ deckId: "deck-1" }, "card-1", "draw");
  });

  it("does not affect other cards", async () => {
    const card2 = makeDeckCard({ id: "card-2", name: "Brainstorm", category: "instant" });
    useDeckStore.setState((state) => ({
      decks: {
        ...state.decks,
        "deck-1": { ...state.decks["deck-1"], cards: [makeDeckCard(), card2] },
      },
    }));
    await useDeckStore.getState().updateCardCategory("card-1", "draw");
    const other = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-2");
    expect(other?.category).toBe("instant");
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().updateCardCategory("card-1", "land");
    expect(deckApi.updateCardCategory).not.toHaveBeenCalled();
  });
});
