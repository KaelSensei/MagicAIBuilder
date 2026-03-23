/**
 * Tests for the new store actions:
 *   - updateDeckDescription
 *   - updateCardNotes
 *   - addTag / removeTag
 *
 * We mock deck-api entirely so no network or DB calls are made.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// ─── Mock deck-api before importing the store ─────────────────────────────────
vi.mock("@/lib/db/deck-api", () => ({
  fetchDecks: vi.fn().mockResolvedValue([]),
  createDeck: vi.fn(),
  updateDeck: vi.fn().mockResolvedValue({}),
  deleteDeck: vi.fn(),
  addCard: vi.fn(),
  removeCard: vi.fn(),
  updateCardCategory: vi.fn(),
  updateCardNotes: vi.fn().mockResolvedValue({}),
  removeAllCards: vi.fn(),
  lookupCardCache: vi.fn().mockResolvedValue(null),
  storeCardCache: vi.fn(),
}));

// Also mock useToast so the store doesn't blow up
vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: vi.fn() }) },
}));

import * as deckApi from "@/lib/db/deck-api";
import type { Deck, DeckCard } from "@/lib/deck/types";

// Import the store AFTER mocks are set up
const { useDeckStore } = await import("@/lib/deck/store");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    description: "",
    tags: [],
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    shareToken: null,
    shareEnabled: false,
    isAIGenerated: false,
    budget: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
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
    notes: null,
    zone: "main" as const,
    ...overrides,
  };
}

/** Seed the store with one deck (bypasses async loadDecks) */
function seedDeck(deck: Deck) {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useDeckStore — updateDeckDescription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck(makeDeck());
  });

  it("updates description optimistically in the store", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateDeckDescription("deck-1", "My strategy is aggro control.");
    expect(useDeckStore.getState().decks["deck-1"].description).toBe("My strategy is aggro control.");
  });

  it("calls the API with the correct payload", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateDeckDescription("deck-1", "Budget deck for casual tables.");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { description: "Budget deck for casual tables." });
  });

  it("persists an empty description", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateDeckDescription("deck-1", "");
    expect(useDeckStore.getState().decks["deck-1"].description).toBe("");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { description: "" });
  });

  it("does not crash when API fails (optimistic value remains)", async () => {
    (deckApi.updateDeck as Mock).mockRejectedValue(new Error("network error"));
    // Should not throw
    await expect(
      useDeckStore.getState().updateDeckDescription("deck-1", "some description")
    ).resolves.toBeUndefined();
    // Optimistic value is kept (no rollback implemented)
    expect(useDeckStore.getState().decks["deck-1"].description).toBe("some description");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — addTag / removeTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck(makeDeck());
  });

  it("addTag — adds a tag optimistically", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().addTag("deck-1", "casual");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("casual");
  });

  it("addTag — persists via API with full tags array", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().addTag("deck-1", "cEDH");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { tags: ["cEDH"] });
  });

  it("addTag — does not add duplicate tags", async () => {
    seedDeck(makeDeck({ tags: ["casual"] }));
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().addTag("deck-1", "casual");
    // API should NOT have been called since tag already exists
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["casual"]);
  });

  it("addTag — trims whitespace from tag names", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().addTag("deck-1", "  budget  ");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("budget");
  });

  it("addTag — ignores empty tags after trim", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().addTag("deck-1", "   ");
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual([]);
  });

  it("addTag — multiple distinct tags accumulate", async () => {
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().addTag("deck-1", "casual");
    await useDeckStore.getState().addTag("deck-1", "WIP");
    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["casual", "WIP"]);
  });

  it("removeTag — removes an existing tag optimistically", async () => {
    seedDeck(makeDeck({ tags: ["casual", "budget"] }));
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().removeTag("deck-1", "casual");
    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["budget"]);
  });

  it("removeTag — calls API with updated tags array", async () => {
    seedDeck(makeDeck({ tags: ["casual", "WIP"] }));
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().removeTag("deck-1", "WIP");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { tags: ["casual"] });
  });

  it("removeTag — is a no-op for nonexistent tags", async () => {
    seedDeck(makeDeck({ tags: ["casual"] }));
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().removeTag("deck-1", "cEDH");
    // Still calls API (same array), but the store content is unchanged
    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["casual"]);
  });

  it("removeTag — results in empty array when last tag removed", async () => {
    seedDeck(makeDeck({ tags: ["budget"] }));
    (deckApi.updateDeck as Mock).mockResolvedValue({});
    await useDeckStore.getState().removeTag("deck-1", "budget");
    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — updateCardNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck(makeDeck({ cards: [makeCard()] }));
  });

  it("updates notes on the correct card optimistically", async () => {
    (deckApi.updateCardNotes as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateCardNotes("card-1", "Key combo piece — protect at all costs");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.notes).toBe("Key combo piece — protect at all costs");
  });

  it("calls the API with deckId, cardId, and notes", async () => {
    (deckApi.updateCardNotes as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateCardNotes("card-1", "Counter all the things");
    expect(deckApi.updateCardNotes).toHaveBeenCalledWith("deck-1", "card-1", "Counter all the things");
  });

  it("clears notes when null is passed", async () => {
    seedDeck(makeDeck({ cards: [makeCard({ notes: "old note" })] }));
    (deckApi.updateCardNotes as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateCardNotes("card-1", null);
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.notes).toBeNull();
    expect(deckApi.updateCardNotes).toHaveBeenCalledWith("deck-1", "card-1", null);
  });

  it("does not affect other cards in the deck", async () => {
    const card2 = makeCard({ id: "card-2", name: "Force of Will" });
    seedDeck(makeDeck({ cards: [makeCard(), card2] }));
    (deckApi.updateCardNotes as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateCardNotes("card-1", "My note");
    const other = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-2");
    expect(other?.notes).toBeNull();
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    (deckApi.updateCardNotes as Mock).mockResolvedValue({});
    await useDeckStore.getState().updateCardNotes("card-1", "some note");
    expect(deckApi.updateCardNotes).not.toHaveBeenCalled();
  });

  it("does not crash when API fails", async () => {
    (deckApi.updateCardNotes as Mock).mockRejectedValue(new Error("timeout"));
    await expect(
      useDeckStore.getState().updateCardNotes("card-1", "note")
    ).resolves.toBeUndefined();
  });
});
