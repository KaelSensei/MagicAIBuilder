/**
 * Tests for the new store actions:
 *   - updateDeckDescription
 *   - updateCardNotes
 *   - addTag / removeTag
 *
 * The fake deck API (`src/test/fake-deck-client.ts`) answers the store's
 * requests in memory, so no network or DB calls are made.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { useDeckStore } from "@/lib/deck/store";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

const deckApi = installFakeDeckClient();
// Toasts are the player's only signal that a save failed, so tests read them.
const toastAdd = recordToasts();

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
    cardCount: 0,
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
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

  it("restores the saved description when the API rejects the edit", async () => {
    (deckApi.updateDeck as Mock).mockRejectedValue(new Error("network error"));
    await expect(
      useDeckStore.getState().updateDeckDescription("deck-1", "some description")
    ).resolves.toBeUndefined();
    expect(useDeckStore.getState().decks["deck-1"].description).toBe("");
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

describe("useDeckStore — failed tag saves", () => {
  const RETRY_TOAST = "Could not save deck tags. Please retry.";

  beforeEach(() => {
    vi.clearAllMocks();
    // Saves succeed unless a test says otherwise; tag actions ignore the reply.
    vi.mocked(deckApi.updateDeck).mockReset();
    seedDeck(makeDeck({ tags: ["casual"] }));
  });

  /** Holds the next tag save open until the test settles it. */
  function holdNextTagSave() {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof deckApi.updateDeck>>>();
    vi.mocked(deckApi.updateDeck).mockReturnValueOnce(pending.promise);
    return pending;
  }

  it("takes an added tag back off the deck and asks for a retry when its save fails", async () => {
    vi.mocked(deckApi.updateDeck).mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().addTag("deck-1", "WIP");

    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["casual"]);
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith("error", RETRY_TOAST);
  });

  it("puts a removed tag back and asks for a retry when its save fails", async () => {
    vi.mocked(deckApi.updateDeck).mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().removeTag("deck-1", "casual");

    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["casual"]);
    expect(toastAdd).toHaveBeenCalledExactlyOnceWith("error", RETRY_TOAST);
  });

  it("keeps a newer saved tag edit when an older one fails", async () => {
    const older = holdNextTagSave();
    const olderAdd = useDeckStore.getState().addTag("deck-1", "WIP");
    // The newer save sends the whole list, WIP included, so it also saves WIP.
    await useDeckStore.getState().addTag("deck-1", "budget");
    older.reject(new Error("offline"));
    await olderAdd;

    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["casual", "WIP", "budget"]);
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("keeps newer saved tags that match the failed attempt", async () => {
    const older = holdNextTagSave();
    const olderAdd = useDeckStore.getState().addTag("deck-1", "WIP");
    await useDeckStore.getState().removeTag("deck-1", "WIP");
    await useDeckStore.getState().addTag("deck-1", "WIP");
    older.reject(new Error("offline"));
    await olderAdd;

    expect(useDeckStore.getState().decks["deck-1"].tags).toEqual(["casual", "WIP"]);
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("does not recreate a deleted deck or warn when its tag save fails late", async () => {
    const pending = holdNextTagSave();
    const add = useDeckStore.getState().addTag("deck-1", "WIP");
    await useDeckStore.getState().deleteDeck("deck-1");
    pending.reject(new Error("offline"));
    await add;

    expect(useDeckStore.getState().decks["deck-1"]).toBeUndefined();
    expect(toastAdd).not.toHaveBeenCalled();
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
