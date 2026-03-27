/**
 * Unit tests for previously-uncovered deck store actions.
 *
 * Covers: undo, setCommander, clearCommander, setPartner, setCompanion,
 * updateCardQuantity, updateCardNotes, moveCardToZone, addToMaybeboard,
 * removeFromMaybeboard, moveToMaybeboard, moveToDeck, updateDeckDescription,
 * addTag, removeTag, duplicateDeck, setDeckGridCols.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

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
  updateCardZone: vi.fn().mockResolvedValue({}),
  removeAllCards: vi.fn().mockResolvedValue(undefined),
  lookupCardCache: vi.fn().mockResolvedValue(null),
  storeCardCache: vi.fn(),
}));

vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: vi.fn() }) },
}));

import * as deckApi from "@/lib/db/deck-api";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

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

describe("useDeckStore — undo", () => {
  beforeEach(() => seedDeck());

  it("does nothing when undo stack is empty", async () => {
    useDeckStore.setState({ undoStack: [] });
    await useDeckStore.getState().undo();
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
  });

  it("undoes ADD_CARD by removing the card", async () => {
    const card = makeDeckCard({ id: "card-1", name: "Counterspell" });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [card] }) },
      activeDeckId: "deck-1",
      undoStack: [{ type: "ADD_CARD", deckId: "deck-1", card }],
    });

    await useDeckStore.getState().undo();

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toHaveLength(0);
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
  });

  it("undoes REMOVE_CARD by re-adding the card", async () => {
    const card = makeDeckCard({ id: "card-1", name: "Counterspell" });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [] }) },
      activeDeckId: "deck-1",
      undoStack: [{ type: "REMOVE_CARD", deckId: "deck-1", card }],
    });

    await useDeckStore.getState().undo();

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0].name).toBe("Counterspell");
    expect(useDeckStore.getState().undoStack).toHaveLength(0);
  });

  it("pops the last action from undo stack", async () => {
    const card = makeDeckCard({ id: "card-1", name: "Counterspell" });
    const card2 = makeDeckCard({ id: "card-2", name: "Force of Will" });
    useDeckStore.setState({
      decks: { "deck-1": makeActiveDeck({ cards: [card, card2] }) },
      activeDeckId: "deck-1",
      undoStack: [
        { type: "ADD_CARD", deckId: "deck-1", card },
        { type: "ADD_CARD", deckId: "deck-1", card: card2 },
      ],
    });

    await useDeckStore.getState().undo();

    expect(useDeckStore.getState().undoStack).toHaveLength(1);
    const deck = useDeckStore.getState().decks["deck-1"];
    // card2 was removed (last undo)
    expect(deck.cards.find((c) => c.name === "Force of Will")).toBeUndefined();
  });
});

describe("useDeckStore — setCommander", () => {
  beforeEach(() => seedDeck());

  it("sets the commander on the active deck", async () => {
    const card = makeScryfallCard({ name: "Atraxa" });
    await useDeckStore.getState().setCommander(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.commander?.name).toBe("Atraxa");
  });

  it("sets commander category to commander", async () => {
    const card = makeScryfallCard({ name: "Atraxa" });
    await useDeckStore.getState().setCommander(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.commander?.category).toBe("commander");
  });

  it("calls updateDeck API with commanderId", async () => {
    const card = makeScryfallCard({ id: "atraxa-id", name: "Atraxa" });
    await useDeckStore.getState().setCommander(card);

    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", expect.objectContaining({ commanderId: "atraxa-id" }));
  });

  it("marks commander as game changer when name is in gameChangerNames", async () => {
    useDeckStore.setState({ gameChangerNames: new Set(["Rhystic Study"]) });
    const card = makeScryfallCard({ name: "Rhystic Study" });
    await useDeckStore.getState().setCommander(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.commander?.isGameChanger).toBe(true);
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.updateDeck).mockClear();
    await useDeckStore.getState().setCommander(makeScryfallCard());
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — clearCommander", () => {
  beforeEach(() => {
    const deck = makeActiveDeck({ commander: makeDeckCard({ id: "cmd-1", name: "Atraxa", category: "commander" }) });
    seedDeck(deck);
  });

  it("clears the commander", async () => {
    await useDeckStore.getState().clearCommander();
    expect(useDeckStore.getState().decks["deck-1"].commander).toBeNull();
  });

  it("clears the partner as well", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": { ...s.decks["deck-1"], partner: makeDeckCard({ name: "Partner" }) },
      },
    }));
    await useDeckStore.getState().clearCommander();
    expect(useDeckStore.getState().decks["deck-1"].partner).toBeNull();
  });

  it("calls updateDeck with commanderId null", async () => {
    await useDeckStore.getState().clearCommander();
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", expect.objectContaining({ commanderId: null }));
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.updateDeck).mockClear();
    await useDeckStore.getState().clearCommander();
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — setPartner", () => {
  beforeEach(() => seedDeck());

  it("sets partner on the active deck", async () => {
    const card = makeScryfallCard({ name: "Tana, the Bloodsower", keywords: ["Partner"] });
    await useDeckStore.getState().setPartner(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.partner?.name).toBe("Tana, the Bloodsower");
  });

  it("clears partner when null is passed", async () => {
    useDeckStore.setState((s) => ({
      decks: { ...s.decks, "deck-1": { ...s.decks["deck-1"], partner: makeDeckCard({ name: "Tana" }) } },
    }));
    await useDeckStore.getState().setPartner(null);

    expect(useDeckStore.getState().decks["deck-1"].partner).toBeNull();
  });

  it("calls updateDeck with partnerId", async () => {
    const card = makeScryfallCard({ id: "tana-id", name: "Tana" });
    await useDeckStore.getState().setPartner(card);
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", expect.objectContaining({ partnerId: "tana-id" }));
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.updateDeck).mockClear();
    await useDeckStore.getState().setPartner(makeScryfallCard());
    expect(deckApi.updateDeck).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — setCompanion", () => {
  beforeEach(() => seedDeck());

  it("sets companion on the active deck", async () => {
    const card = makeScryfallCard({ name: "Lurrus of the Dream-Den" });
    await useDeckStore.getState().setCompanion(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.companion?.name).toBe("Lurrus of the Dream-Den");
  });

  it("clears companion when null is passed", async () => {
    useDeckStore.setState((s) => ({
      decks: { ...s.decks, "deck-1": { ...s.decks["deck-1"], companion: makeDeckCard({ name: "Lurrus" }) } },
    }));
    await useDeckStore.getState().setCompanion(null);
    expect(useDeckStore.getState().decks["deck-1"].companion).toBeNull();
  });

  it("calls updateDeck with companionId", async () => {
    const card = makeScryfallCard({ id: "lurrus-id", name: "Lurrus" });
    await useDeckStore.getState().setCompanion(card);
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", expect.objectContaining({ companionId: "lurrus-id" }));
  });
});

describe("useDeckStore — updateCardNotes", () => {
  beforeEach(() => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard({ id: "card-1", name: "Counterspell" })] }));
  });

  it("updates notes optimistically", async () => {
    await useDeckStore.getState().updateCardNotes("card-1", "Draw 2");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.notes).toBe("Draw 2");
  });

  it("clears notes when null is passed", async () => {
    await useDeckStore.getState().updateCardNotes("card-1", null);
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.notes).toBeNull();
  });

  it("calls updateCardNotes API", async () => {
    await useDeckStore.getState().updateCardNotes("card-1", "Test note");
    expect(deckApi.updateCardNotes).toHaveBeenCalledWith("deck-1", "card-1", "Test note");
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.updateCardNotes).mockClear();
    await useDeckStore.getState().updateCardNotes("card-1", "note");
    expect(deckApi.updateCardNotes).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — moveCardToZone", () => {
  beforeEach(() => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard({ id: "card-1", zone: "main" })] }));
  });

  it("updates card zone optimistically", async () => {
    await useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.zone).toBe("sideboard");
  });

  it("calls updateCardZone API", async () => {
    await useDeckStore.getState().moveCardToZone("card-1", "maybeboard");
    expect(deckApi.updateCardZone).toHaveBeenCalledWith("deck-1", "card-1", "maybeboard");
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.updateCardZone).mockClear();
    await useDeckStore.getState().moveCardToZone("card-1", "sideboard");
    expect(deckApi.updateCardZone).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — addToMaybeboard", () => {
  beforeEach(() => seedDeck());

  it("adds card to maybeboard", async () => {
    const card = makeScryfallCard({ name: "Brainstorm" });
    await useDeckStore.getState().addToMaybeboard(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.maybeboard).toHaveLength(1);
    expect(deck.maybeboard[0].name).toBe("Brainstorm");
  });

  it("marks card as isMaybeboard=true", async () => {
    const card = makeScryfallCard({ name: "Brainstorm" });
    await useDeckStore.getState().addToMaybeboard(card);

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.maybeboard[0].isMaybeboard).toBe(true);
  });

  it("does not add duplicate card by name", async () => {
    const card = makeScryfallCard({ name: "Brainstorm" });
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": { ...s.decks["deck-1"], maybeboard: [makeDeckCard({ name: "Brainstorm" })] },
      },
    }));
    await useDeckStore.getState().addToMaybeboard(card);

    expect(useDeckStore.getState().decks["deck-1"].maybeboard).toHaveLength(1);
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.addCard).mockClear();
    await useDeckStore.getState().addToMaybeboard(makeScryfallCard());
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — removeFromMaybeboard", () => {
  beforeEach(() => {
    seedDeck(makeActiveDeck({ maybeboard: [makeDeckCard({ id: "card-1", name: "Brainstorm" })] }));
  });

  it("removes card from maybeboard", async () => {
    await useDeckStore.getState().removeFromMaybeboard("card-1");
    expect(useDeckStore.getState().decks["deck-1"].maybeboard).toHaveLength(0);
  });

  it("calls removeCard API", async () => {
    await useDeckStore.getState().removeFromMaybeboard("card-1");
    expect(deckApi.removeCard).toHaveBeenCalledWith("deck-1", "card-1");
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    vi.mocked(deckApi.removeCard).mockClear();
    await useDeckStore.getState().removeFromMaybeboard("card-1");
    expect(deckApi.removeCard).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — moveToMaybeboard", () => {
  beforeEach(() => {
    seedDeck(makeActiveDeck({ cards: [makeDeckCard({ id: "card-1", name: "Counterspell" })] }));
  });

  it("moves card from deck to maybeboard", async () => {
    await useDeckStore.getState().moveToMaybeboard("card-1");

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.cards).toHaveLength(0);
    expect(deck.maybeboard).toHaveLength(1);
    expect(deck.maybeboard[0].name).toBe("Counterspell");
  });

  it("calls updateCardMaybeboard API with true", async () => {
    await useDeckStore.getState().moveToMaybeboard("card-1");
    expect(deckApi.updateCardMaybeboard).toHaveBeenCalledWith("deck-1", "card-1", true);
  });

  it("does nothing when card not found", async () => {
    vi.mocked(deckApi.updateCardMaybeboard).mockClear();
    await useDeckStore.getState().moveToMaybeboard("nonexistent");
    expect(deckApi.updateCardMaybeboard).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — moveToDeck", () => {
  beforeEach(() => {
    seedDeck(makeActiveDeck({ maybeboard: [makeDeckCard({ id: "card-1", name: "Counterspell", isMaybeboard: true })] }));
  });

  it("moves card from maybeboard to deck", async () => {
    await useDeckStore.getState().moveToDeck("card-1");

    const deck = useDeckStore.getState().decks["deck-1"];
    expect(deck.maybeboard).toHaveLength(0);
    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0].isMaybeboard).toBe(false);
  });

  it("calls updateCardMaybeboard API with false", async () => {
    await useDeckStore.getState().moveToDeck("card-1");
    expect(deckApi.updateCardMaybeboard).toHaveBeenCalledWith("deck-1", "card-1", false);
  });

  it("does not move if card already in deck (same name)", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          cards: [makeDeckCard({ id: "card-2", name: "Counterspell" })],
        },
      },
    }));
    vi.mocked(deckApi.updateCardMaybeboard).mockClear();
    await useDeckStore.getState().moveToDeck("card-1");
    expect(deckApi.updateCardMaybeboard).not.toHaveBeenCalled();
  });

  it("does nothing when card not found in maybeboard", async () => {
    vi.mocked(deckApi.updateCardMaybeboard).mockClear();
    await useDeckStore.getState().moveToDeck("nonexistent");
    expect(deckApi.updateCardMaybeboard).not.toHaveBeenCalled();
  });
});

describe("useDeckStore — updateDeckDescription", () => {
  beforeEach(() => seedDeck());

  it("updates description optimistically", async () => {
    await useDeckStore.getState().updateDeckDescription("deck-1", "A great deck");
    expect(useDeckStore.getState().decks["deck-1"].description).toBe("A great deck");
  });

  it("calls updateDeck API with description", async () => {
    await useDeckStore.getState().updateDeckDescription("deck-1", "A great deck");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { description: "A great deck" });
  });
});

describe("useDeckStore — addTag / removeTag", () => {
  beforeEach(() => seedDeck(makeActiveDeck({ tags: [] })));

  it("addTag adds tag to deck", async () => {
    await useDeckStore.getState().addTag("deck-1", "aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("aggro");
  });

  it("addTag trims whitespace", async () => {
    await useDeckStore.getState().addTag("deck-1", "  control  ");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("control");
  });

  it("addTag does not add duplicate tag", async () => {
    await useDeckStore.getState().addTag("deck-1", "aggro");
    await useDeckStore.getState().addTag("deck-1", "aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).toHaveLength(1);
  });

  it("addTag does not add empty tag", async () => {
    await useDeckStore.getState().addTag("deck-1", "   ");
    expect(useDeckStore.getState().decks["deck-1"].tags).toHaveLength(0);
  });

  it("removeTag removes tag from deck", async () => {
    useDeckStore.setState((s) => ({
      decks: { ...s.decks, "deck-1": { ...s.decks["deck-1"], tags: ["aggro", "combo"] } },
    }));
    await useDeckStore.getState().removeTag("deck-1", "aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).not.toContain("aggro");
    expect(useDeckStore.getState().decks["deck-1"].tags).toContain("combo");
  });

  it("addTag calls updateDeck API", async () => {
    await useDeckStore.getState().addTag("deck-1", "stax");
    expect(deckApi.updateDeck).toHaveBeenCalledWith("deck-1", { tags: ["stax"] });
  });
});

describe("useDeckStore — setDeckGridCols", () => {
  it("updates deckGridCols", () => {
    useDeckStore.getState().setDeckGridCols(4);
    expect(useDeckStore.getState().deckGridCols).toBe(4);
  });

  it("accepts all valid column values", () => {
    for (const cols of [2, 3, 4, 6, 8] as const) {
      useDeckStore.getState().setDeckGridCols(cols);
      expect(useDeckStore.getState().deckGridCols).toBe(cols);
    }
  });
});

describe("useDeckStore — duplicateDeck", () => {
  beforeEach(() => {
    seedDeck();
    vi.mocked(deckApi.fetchDecks).mockResolvedValue([]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "deck-2", name: "Test Deck (copy)" }),
    }) as unknown as typeof fetch;
  });

  it("sets activeDeckId to the new deck id", async () => {
    await useDeckStore.getState().duplicateDeck("deck-1");
    expect(useDeckStore.getState().activeDeckId).toBe("deck-2");
  });

  it("calls /api/decks/:id/duplicate with POST", async () => {
    await useDeckStore.getState().duplicateDeck("deck-1");
    expect(global.fetch).toHaveBeenCalledWith("/api/decks/deck-1/duplicate", { method: "POST" });
  });
});

describe("useDeckStore — updateCardQuantity", () => {
  beforeEach(() => {
    // Use a basic land — maxQuantity returns 99 for basic lands, allowing increments
    seedDeck(makeActiveDeck({
      cards: [makeDeckCard({ id: "card-1", name: "Island", typeLine: "Basic Land — Island", quantity: 1 })],
    }));
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it("increments quantity by delta", async () => {
    await useDeckStore.getState().updateCardQuantity("card-1", 1);
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.quantity).toBe(2);
  });

  it("decrements quantity by delta, minimum 1", async () => {
    useDeckStore.setState((s) => ({
      decks: {
        ...s.decks,
        "deck-1": {
          ...s.decks["deck-1"],
          cards: [makeDeckCard({ id: "card-1", name: "Island", typeLine: "Basic Land — Island", quantity: 3 })],
        },
      },
    }));
    await useDeckStore.getState().updateCardQuantity("card-1", -1);
    const card = useDeckStore.getState().decks["deck-1"].cards.find((c) => c.id === "card-1");
    expect(card?.quantity).toBe(2);
  });

  it("does nothing when no active deck", async () => {
    useDeckStore.setState({ activeDeckId: null });
    await useDeckStore.getState().updateCardQuantity("card-1", 1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does nothing when card not found", async () => {
    await useDeckStore.getState().updateCardQuantity("nonexistent", 1);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
