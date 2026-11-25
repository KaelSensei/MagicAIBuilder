/**
 * Reloading the open deck after the server replaced its cards.
 *
 * Snapshot restore and package apply write a new card list in the database.
 * The deck listing is intentionally lightweight, so reloading that list keeps
 * the cards already on screen. The editor has to fetch the full deck again.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiDeck } from "@/lib/db/deck-api";
import type { DeckCard } from "@/lib/deck/types";
import { DeckApiRefusal, installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

import { useDeckStore } from "./store";

const mockFetchDeck = installFakeDeckClient().fetchDeck;
const toastAdd = recordToasts();

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

function apiDeck(name: string, zone: "main" | "sideboard"): ApiDeck {
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
    commanderName: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    companion: null,
    maybeboard: [],
    cards: [
      {
        id: "card-1",
        deckId: "deck-1",
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
      deckOpenError: null,
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

  // Deleted from another tab or device: the rows held describe a deck the
  // server no longer has, so the builder shows "Deck not found" (I-01).
  it("drops a deck the server no longer has and records it as not found, without a refresh toast", async () => {
    mockFetchDeck.mockResolvedValueOnce(apiDeck("Old Card", "main"));
    await useDeckStore.getState().setActiveDeck("deck-1");
    useDeckStore.setState({
      undoStack: [
        { type: "REMOVE_CARD", deckId: "deck-1", card: REMOVED_CARD },
      ],
    });
    mockFetchDeck.mockRejectedValueOnce(
      new DeckApiRefusal(404, "Deck not found")
    );

    await useDeckStore.getState().reloadActiveDeck();

    const state = useDeckStore.getState();
    expect(state.decks["deck-1"]).toBeUndefined();
    expect(state.deckOpenError).toEqual(
      expect.objectContaining({ deckId: "deck-1", kind: "not-found" })
    );
    expect(state.undoStack).toEqual([]);
    expect(state.isSyncing).toBe(false);
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("keeps the deck and says the refresh failed when the server fails", async () => {
    mockFetchDeck.mockResolvedValueOnce(apiDeck("Old Card", "main"));
    await useDeckStore.getState().setActiveDeck("deck-1");
    mockFetchDeck.mockRejectedValueOnce(
      new DeckApiRefusal(500, "Failed to load deck")
    );

    await useDeckStore.getState().reloadActiveDeck();

    const state = useDeckStore.getState();
    expect(state.decks["deck-1"]?.cards).toEqual([
      expect.objectContaining({ name: "Old Card" }),
    ]);
    expect(state.deckOpenError).toBeNull();
    expect(toastAdd).toHaveBeenCalledWith("error", {
      key: "deck.sync.refreshFailed",
    });
  });
});
