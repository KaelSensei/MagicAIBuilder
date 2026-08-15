/**
 * Deck hydration on a cold load.
 *
 * Opening /builder/<id> directly — a bookmark, a refresh, a shared link, or
 * simply landing there after an import — must end with the deck's cards in the
 * store. Two separate holes broke that, and each is covered here.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFetchDeck, mockFetchDecks } = vi.hoisted(() => ({
  mockFetchDeck: vi.fn(),
  mockFetchDecks: vi.fn(),
}));

vi.mock("@/lib/db/deck-api", () => ({
  fetchDeck: mockFetchDeck,
  fetchDecks: mockFetchDecks,
  createDeck: vi.fn(),
  updateDeck: vi.fn(),
  deleteDeck: vi.fn(),
  duplicateDeck: vi.fn(),
  addCard: vi.fn(),
  removeCard: vi.fn(),
  updateCardCategory: vi.fn(),
  updateCardNotes: vi.fn(),
  updateCardZone: vi.fn(),
  updateCardMaybeboard: vi.fn(),
  removeAllCards: vi.fn(),
  lookupCardCache: vi.fn(),
  storeCardCache: vi.fn(),
  lookupSearchCache: vi.fn(),
  storeSearchCache: vi.fn(),
}));

import { useDeckStore } from "./store";

/** An API card as the deck endpoints return it. */
function apiCard(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    scryfallId: id,
    name: `Card ${id}`,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: ["G"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    zone: "main",
    notes: null,
    ...overrides,
  };
}

/** An API deck, shaped like the full single-deck endpoint. */
function apiDeck(cardIds: readonly string[], overrides: Record<string, unknown> = {}) {
  return {
    id: "deck-1",
    name: "Cold Load Deck",
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
    commanderId: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    cards: cardIds.map((id) => apiCard(id)),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** The same deck as the lightweight listing returns it: no main cards, a count. */
function listingDeck(cardCount: number) {
  return apiDeck([], { _count: { cards: cardCount } });
}

const TWENTY_CARDS = Array.from({ length: 20 }, (_, i) => `c${i}`);

describe("setActiveDeck — cold load hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDeckStore.setState({ decks: {}, activeDeckId: null, isSyncing: false });
    mockFetchDecks.mockResolvedValue({ decks: [], total: 0, page: 0, limit: 20 });
  });

  // The guard used to be `if (deck && loadedCount < deck.cardCount)`. On a
  // direct navigation the store is still empty, so `deck` was undefined and the
  // full fetch never ran — leaving the deck permanently card-less.
  it("fetches the full deck when it is not in the store at all", async () => {
    mockFetchDeck.mockResolvedValue(apiDeck(TWENTY_CARDS));

    await useDeckStore.getState().setActiveDeck("deck-1");

    expect(mockFetchDeck).toHaveBeenCalledWith("deck-1");
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(20);
  });

  it("fetches the full deck when the store only holds the listing version", async () => {
    useDeckStore.setState({
      decks: {
        "deck-1": {
          ...useDeckStore.getState().decks["deck-1"],
          ...toStoreShape(listingDeck(20)),
        },
      },
    });
    mockFetchDeck.mockResolvedValue(apiDeck(TWENTY_CARDS));

    await useDeckStore.getState().setActiveDeck("deck-1");

    expect(mockFetchDeck).toHaveBeenCalledWith("deck-1");
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(20);
  });

  it("does not re-fetch a deck whose cards are already loaded", async () => {
    mockFetchDeck.mockResolvedValue(apiDeck(TWENTY_CARDS));
    await useDeckStore.getState().setActiveDeck("deck-1");
    mockFetchDeck.mockClear();

    await useDeckStore.getState().setActiveDeck("deck-1");

    expect(mockFetchDeck).not.toHaveBeenCalled();
  });

  it("still sets the active id when the fetch fails", async () => {
    mockFetchDeck.mockRejectedValue(new Error("offline"));

    await useDeckStore.getState().setActiveDeck("deck-1");

    expect(useDeckStore.getState().activeDeckId).toBe("deck-1");
  });
});

describe("loadDecks — preserving hydrated decks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDeckStore.setState({ decks: {}, activeDeckId: null, isSyncing: false });
  });

  // loadDecks replaces the whole map from the lightweight listing. Running
  // after setActiveDeck had hydrated a deck, it threw the cards away again.
  it("does not overwrite an already-hydrated deck with the listing version", async () => {
    mockFetchDeck.mockResolvedValue(apiDeck(TWENTY_CARDS));
    await useDeckStore.getState().setActiveDeck("deck-1");
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(20);

    mockFetchDecks.mockResolvedValue({
      decks: [listingDeck(20)],
      total: 1,
      page: 0,
      limit: 20,
    });
    await useDeckStore.getState().loadDecks();

    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(20);
  });

  it("still adds decks the store has never seen", async () => {
    mockFetchDecks.mockResolvedValue({
      decks: [listingDeck(20), apiDeck([], { id: "deck-2", _count: { cards: 5 } })],
      total: 2,
      page: 0,
      limit: 20,
    });

    await useDeckStore.getState().loadDecks();

    expect(Object.keys(useDeckStore.getState().decks).sort()).toEqual([
      "deck-1",
      "deck-2",
    ]);
  });

  it("drops decks that no longer exist server-side", async () => {
    mockFetchDeck.mockResolvedValue(apiDeck(TWENTY_CARDS));
    await useDeckStore.getState().setActiveDeck("deck-1");

    mockFetchDecks.mockResolvedValue({ decks: [], total: 0, page: 0, limit: 20 });
    await useDeckStore.getState().loadDecks();

    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
  });
});

/** Minimal store-shaped deck, for seeding state directly. */
function toStoreShape(deck: ReturnType<typeof apiDeck>) {
  return {
    id: deck.id,
    name: deck.name,
    format: deck.format as "commander",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none" as const,
    cards: [],
    maybeboard: [],
    cardCount: (deck as { _count?: { cards: number } })._count?.cards ?? 0,
    targetBracket: 3 as const,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(deck.createdAt),
    updatedAt: new Date(deck.updatedAt),
  };
}
