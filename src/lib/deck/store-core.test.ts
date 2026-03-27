/**
 * Unit tests for core deck store actions.
 *
 * Covers: setGameChangerNames, setBannedNames, setSearchViewMode,
 * setDeckViewMode, setActiveDeck, loadDecks, createDeck, deleteDeck,
 * renameDeck, getActiveDeck, setTargetBracket, setBudget, setManualBracket,
 * addCard, removeCard, updateCardCategory, markGameChanger, markBanned.
 *
 * All network / DB calls are mocked — tests are fully synchronous / offline.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// ── Mock deck-api BEFORE importing the store ─────────────────────────────────
vi.mock("@/lib/db/deck-api", () => ({
  fetchDecks: vi.fn().mockResolvedValue([]),
  createDeck: vi.fn().mockResolvedValue({
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
    partnerId: null,
    companionId: null,
    pairingType: "none",
    cards: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  updateDeck: vi.fn().mockResolvedValue({}),
  deleteDeck: vi.fn().mockResolvedValue(undefined),
  addCard: vi.fn().mockResolvedValue({
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
  }),
  removeCard: vi.fn().mockResolvedValue(undefined),
  updateCardCategory: vi.fn().mockResolvedValue({}),
  updateCardNotes: vi.fn().mockResolvedValue({}),
  updateCardMaybeboard: vi.fn().mockResolvedValue({}),
  removeAllCards: vi.fn().mockResolvedValue(undefined),
  lookupCardCache: vi.fn().mockResolvedValue(null),
  storeCardCache: vi.fn(),
  updateCardZone: vi.fn().mockResolvedValue({}),
}));

// ── Mock useToast so the store doesn't blow up ────────────────────────────────
vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: vi.fn() }) },
}));

import * as deckApi from "@/lib/db/deck-api";
import type { Deck, DeckCard, CardCategory } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

// Import the store AFTER mocks are set up
const { useDeckStore } = await import("@/lib/deck/store");

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
    (deckApi.fetchDecks as Mock).mockResolvedValueOnce([
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
    ]);
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
    (deckApi.fetchDecks as Mock).mockResolvedValueOnce([]);
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

  it("keeps the optimistic name even if API fails", async () => {
    (deckApi.updateDeck as Mock).mockRejectedValueOnce(new Error("server error"));
    await useDeckStore.getState().renameDeck("deck-1", "New Name");
    expect(useDeckStore.getState().decks["deck-1"].name).toBe("New Name");
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — setTargetBracket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck();
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

  it("adds a new card to the deck", async () => {
    const card = makeScryfallCard();
    await useDeckStore.getState().addCard(card);
    expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(1);
    expect(useDeckStore.getState().decks["deck-1"].cards[0].name).toBe("Lightning Bolt");
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
      "deck-1",
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
    expect(deckApi.removeCard).toHaveBeenCalledWith("deck-1", "card-1");
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
    expect(deckApi.updateCardCategory).toHaveBeenCalledWith("deck-1", "card-1", "draw");
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

// ─────────────────────────────────────────────────────────────────────────────

describe("useDeckStore — markGameChanger / markBanned", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeck(
      makeActiveDeck({
        cards: [
          makeDeckCard({ id: "card-1", name: "Rhystic Study" }),
          makeDeckCard({ id: "card-2", name: "Sol Ring" }),
        ],
      })
    );
  });

  it("markGameChanger sets isGameChanger=true for matching card name", () => {
    useDeckStore.getState().markGameChanger("Rhystic Study");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.isGameChanger).toBe(true);
  });

  it("markGameChanger does not affect cards with different names", () => {
    useDeckStore.getState().markGameChanger("Rhystic Study");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-2");
    expect(card?.isGameChanger).toBe(false);
  });

  it("markGameChanger does nothing when no active deck", () => {
    useDeckStore.setState({ activeDeckId: null });
    useDeckStore.getState().markGameChanger("Rhystic Study");
    expect(Object.keys(useDeckStore.getState().decks)).toHaveLength(1);
  });

  it("markBanned sets isBanned=true for matching card name", () => {
    useDeckStore.getState().markBanned("Rhystic Study");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.isBanned).toBe(true);
  });

  it("markBanned does not affect cards with different names", () => {
    useDeckStore.getState().markBanned("Rhystic Study");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-2");
    expect(card?.isBanned).toBe(false);
  });

  it("markBanned does nothing when no active deck", () => {
    useDeckStore.setState({ activeDeckId: null });
    useDeckStore.getState().markBanned("Some Card");
    expect(Object.keys(useDeckStore.getState().decks)).toHaveLength(1);
  });

  it("markGameChanger is idempotent when called twice", () => {
    useDeckStore.getState().markGameChanger("Rhystic Study");
    useDeckStore.getState().markGameChanger("Rhystic Study");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.isGameChanger).toBe(true);
  });
});
