/**
 * Reloading the open deck after the server replaced its cards.
 *
 * Snapshot restore and package apply write a new card list in the database.
 * The deck listing is intentionally lightweight, so reloading that list keeps
 * the cards already on screen. The editor has to fetch the full deck again.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckCard } from "@/lib/deck/types";

const { mockFetchDeck, toastAdd } = vi.hoisted(() => ({
  mockFetchDeck: vi.fn(),
  toastAdd: vi.fn(),
}));

vi.mock("@/lib/db/deck-api", () => ({
  fetchDeck: mockFetchDeck,
  fetchDecks: vi.fn(),
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

vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: toastAdd }) },
}));

import { useDeckStore } from "./store";

const REMOVED_CARD: DeckCard = {
  id: "old-card",
  name: "Old Card",
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
  zone: "main",
};

function apiDeck(name: string, zone: "main" | "sideboard") {
  return {
    id: "deck-1",
    name: "Open Deck",
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
    cards: [
      {
        id: "card-1",
        scryfallId: "card-1",
        name,
        manaCost: "{G}",
        cmc: 1,
        typeLine: "Creature — Bird",
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
        zone,
        notes: null,
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("reloadActiveDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDeckStore.setState({
      decks: {},
      activeDeckId: null,
      isSyncing: false,
      undoStack: [],
    });
  });

  it("replaces an already open deck with the restored server cards", async () => {
    mockFetchDeck.mockResolvedValueOnce(apiDeck("Old Card", "main"));
    await useDeckStore.getState().setActiveDeck("deck-1");
    useDeckStore.setState({
      undoStack: [{ type: "REMOVE_CARD", deckId: "deck-1", card: REMOVED_CARD }],
    });
    mockFetchDeck.mockResolvedValueOnce(apiDeck("Restored Card", "sideboard"));

    await useDeckStore.getState().reloadActiveDeck();

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toEqual([
      expect.objectContaining({ name: "Restored Card", zone: "sideboard" }),
    ]);
    expect(useDeckStore.getState().undoStack).toEqual([]);
    expect(useDeckStore.getState().isSyncing).toBe(false);
    expect(toastAdd).not.toHaveBeenCalled();
  });
});
