/**
 * `cardCount` after an edit of a loaded deck.
 *
 * The listing (`GET /api/decks`) sends the command zone and a row count, so
 * `isDeckStub` compares the rows the store holds with `cardCount` to know
 * whether the full deck is still to be fetched. Once the rows are loaded, every
 * edit of those rows must keep `cardCount` in step: a count left behind made
 * the builder read a deck a card lighter as "half loaded" and show
 * "Loading deck…" for good (found by the P1-12 journeys, 2026-11-12).
 *
 * Sociable tests: the deck is fetched through the fake deck API
 * (`src/test/fake-deck-client.ts`), so the real mapper sets the count first.
 * The collection store runs for real and holds nothing, so no owned printing
 * is ever looked up.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";
import { useDeckStore } from "./store";
import { isDeckStub } from "./store-factories";
import type { Deck } from "./types";

const api = installFakeDeckClient();
recordToasts();

const DECK_ID = "deck-1";

/** A saved row, as `GET /api/decks/[id]` returns it. */
function apiRow(
  id: string,
  name: string,
  row: Partial<ApiDeckCard> = {}
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
    ...row,
  };
}

/** The deck as the API returns it, holding these rows. */
function apiDeck(
  cards: readonly ApiDeckCard[],
  deck: Partial<ApiDeck> = {}
): ApiDeck {
  return {
    id: DECK_ID,
    name: "Artifacts",
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    commanderId: null,
    commanderName: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    companion: null,
    maybeboard: [],
    cards: [...cards],
    ...deck,
  };
}

function scryfallCard(name: string): ScryfallCard {
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
  };
}

const SOL_RING = apiRow("row-sol-ring", "Sol Ring");
const MANA_CRYPT = apiRow("row-mana-crypt", "Mana Crypt");
// CR 903.5b: basic lands are exempt from the singleton rule, so their quantity can grow.
const ISLANDS = apiRow("row-island", "Island", {
  typeLine: "Basic Land — Island",
  category: "land",
  quantity: 3,
});
const COMMANDER = apiRow("row-commander", "Urza, Lord High Artificer", {
  typeLine: "Legendary Creature — Human Artificer",
  category: "creature",
  isCommander: true,
});
const COMPANION = apiRow("row-companion", "Lurrus of the Dream-Den", {
  typeLine: "Legendary Creature — Cat Nightmare",
  category: "companion",
});

/** Saves the deck in the fake API and opens it, as the builder page does. */
async function openSavedDeck(deck: ApiDeck): Promise<void> {
  api.seedDeck(deck);
  await useDeckStore.getState().setActiveDeck(DECK_ID);
}

function activeDeck(): Deck {
  const deck = useDeckStore.getState().decks[DECK_ID];
  if (!deck) throw new Error("the deck under test is not in the store");
  return deck;
}

/** How many card rows the store holds for the deck, command zone included. */
function loadedRows(deck: Deck): number {
  return (
    deck.cards.length +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0) +
    (deck.companion ? 1 : 0)
  );
}

/** The count and the stub reading together, so a failure shows both. */
function countReading(deck: Deck) {
  return {
    cardCount: deck.cardCount,
    loaded: loadedRows(deck),
    stub: isDeckStub(deck),
  };
}

function inStep(deck: Deck) {
  return { cardCount: loadedRows(deck), loaded: loadedRows(deck), stub: false };
}

describe("deck store — cardCount follows the loaded rows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDeckStore.setState({
      decks: {},
      activeDeckId: null,
      isSyncing: false,
      gameChangerNames: new Set(),
      bannedNames: new Set(),
      undoStack: [],
    });
  });

  it("keeps the deck loaded and its other cards after a card is removed", async () => {
    await openSavedDeck(apiDeck([SOL_RING, MANA_CRYPT]));

    await useDeckStore.getState().removeCard(MANA_CRYPT.id);

    const deck = activeDeck();
    expect(deck.cards.map((card) => card.name)).toEqual(["Sol Ring"]);
    expect(countReading(deck)).toEqual(inStep(deck));
  });

  it("counts a card that was added", async () => {
    await openSavedDeck(apiDeck([SOL_RING]));

    await useDeckStore.getState().addCard(scryfallCard("Mana Crypt"));

    const deck = activeDeck();
    expect(deck.cards).toHaveLength(2);
    expect(countReading(deck)).toEqual(inStep(deck));
  });

  it("counts rows, not copies: a quantity change leaves the count alone", async () => {
    await openSavedDeck(apiDeck([SOL_RING, ISLANDS]));

    await useDeckStore.getState().updateCardQuantity(ISLANDS.id, 1);

    const deck = activeDeck();
    expect(deck.cards.find((card) => card.id === ISLANDS.id)?.quantity).toBe(4);
    expect(countReading(deck)).toEqual({
      cardCount: 2,
      loaded: 2,
      stub: false,
    });
  });

  it("keeps the count across a zone move", async () => {
    await openSavedDeck(apiDeck([SOL_RING, MANA_CRYPT]));

    await useDeckStore.getState().moveCardToZone(MANA_CRYPT.id, "sideboard");

    const deck = activeDeck();
    expect(deck.cards.find((card) => card.id === MANA_CRYPT.id)?.zone).toBe(
      "sideboard"
    );
    expect(countReading(deck)).toEqual({
      cardCount: 2,
      loaded: 2,
      stub: false,
    });
  });

  it("counts a removed card again once the removal is undone", async () => {
    await openSavedDeck(apiDeck([SOL_RING, MANA_CRYPT]));
    await useDeckStore.getState().removeCard(MANA_CRYPT.id);

    await useDeckStore.getState().undo();

    const deck = activeDeck();
    expect(deck.cards).toHaveLength(2);
    expect(countReading(deck)).toEqual({
      cardCount: 2,
      loaded: 2,
      stub: false,
    });
  });

  it("takes the count of the deck a bulk edit saved", async () => {
    await openSavedDeck(apiDeck([SOL_RING, MANA_CRYPT]));

    await useDeckStore.getState().applyBulkEdit({
      removedCardIds: [MANA_CRYPT.id],
      quantityChanges: [],
      additions: [],
      commandZone: null,
    });

    const deck = activeDeck();
    expect(deck.cards.map((card) => card.name)).toEqual(["Sol Ring"]);
    expect(countReading(deck)).toEqual(inStep(deck));
  });

  it("keeps the deck loaded after the commander is cleared", async () => {
    await openSavedDeck(
      apiDeck([COMMANDER, SOL_RING], {
        commanderId: COMMANDER.scryfallId,
        commanderName: COMMANDER.name,
      })
    );

    await useDeckStore.getState().clearCommander();

    const deck = activeDeck();
    expect(deck.commander).toBeNull();
    expect(countReading(deck)).toEqual(inStep(deck));
  });

  it("keeps the deck loaded after the companion is removed", async () => {
    await openSavedDeck(
      apiDeck([COMPANION, SOL_RING], { companionId: COMPANION.scryfallId })
    );

    await useDeckStore.getState().setCompanion(null);

    const deck = activeDeck();
    expect(deck.companion).toBeNull();
    expect(countReading(deck)).toEqual(inStep(deck));
  });

  it("shows the edited row count in the deck list without a reload", async () => {
    await openSavedDeck(apiDeck([SOL_RING, MANA_CRYPT]));
    await useDeckStore.getState().removeCard(MANA_CRYPT.id);

    await useDeckStore.getState().loadDecks();

    expect(activeDeck().cardCount).toBe(1);
  });

  it("still reads a deck from the listing as a stub until its rows arrive", async () => {
    api.seedDeck(apiDeck([SOL_RING, MANA_CRYPT]));

    await useDeckStore.getState().loadDecks();

    const listed = activeDeck();
    expect(listed.cards).toEqual([]);
    expect(countReading(listed)).toEqual({
      cardCount: 2,
      loaded: 0,
      stub: true,
    });
  });
});
