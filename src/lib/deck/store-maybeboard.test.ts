/**
 * Unit tests for maybeboard actions in the deck store.
 *
 * The store makes HTTP calls via deck-api. We mock that module so tests are
 * fully synchronous / offline.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock deck-api BEFORE importing the store ──────────────────────────────────
vi.mock("@/lib/db/deck-api", () => ({
  addCard: vi.fn(async (_deckId: string, payload: Record<string, unknown>) => ({
    ...payload,
    id: `${String(payload.scryfallId)}-saved`,
    deckId: "deck-1",
    scryfallId: payload.scryfallId,
    isCommander: false,
    isPartner: false,
    isMaybeboard: payload.zone === "maybeboard",
  })),
  removeCard: vi.fn(async () => undefined),
  updateCardZone: vi.fn(async (_deckId: string, cardId: string, zone: string) => ({
    id: cardId,
    zone,
  })),
  updateCardMaybeboard: vi.fn(async (_deckId: string, cardId: string, isMaybeboard: boolean) => ({
    id: cardId,
    isMaybeboard,
  })),
  fetchDecks: vi.fn(async () => ({ decks: [], total: 0, page: 0, limit: 20 })),
  createDeck: vi.fn(async () => ({ id: "deck-1", name: "Test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), cards: [] })),
  updateDeck: vi.fn(async () => ({})),
  deleteDeck: vi.fn(async () => undefined),
  updateCardCategory: vi.fn(async () => ({})),
  removeAllCards: vi.fn(async () => undefined),
}));

// ── Mock useToast (imported inside store) ─────────────────────────────────────
vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: vi.fn() }) },
}));

import { useDeckStore } from "@/lib/deck/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function makeDeckCard(id: string, name: string, extra: Partial<DeckCard> = {}): DeckCard {
  return {
    id,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main" as const,
    ...extra,
  };
}

function seedDeck(): Deck {
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
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Deck store — maybeboard actions", () => {
  beforeEach(() => {
    // Reset store state between tests
    useDeckStore.setState({
      decks: { "deck-1": seedDeck() },
      activeDeckId: "deck-1",
      isSyncing: false,
      gameChangerNames: new Set(),
      bannedNames: new Set(),
    });
  });

  // ── addToMaybeboard ────────────────────────────────────────────────────────

  describe("addToMaybeboard", () => {
    it("adds a card to maybeboard, not to main deck", async () => {
      const card = makeScryfallCard();
      await useDeckStore.getState().addToMaybeboard(card);

      const deck = useDeckStore.getState().decks["deck-1"];
      expect(deck.maybeboard).toHaveLength(1);
      expect(deck.maybeboard[0].name).toBe("Lightning Bolt");
      expect(deck.cards).toHaveLength(1);
      expect(deck.cards[0].zone).toBe("maybeboard");
    });

    it("does not add duplicate (same name) to maybeboard", async () => {
      const card = makeScryfallCard();
      await useDeckStore.getState().addToMaybeboard(card);
      await useDeckStore.getState().addToMaybeboard(card);

      const deck = useDeckStore.getState().decks["deck-1"];
      expect(deck.maybeboard).toHaveLength(1);
    });

    it("allows duplicate basic lands in maybeboard", async () => {
      const forest = makeScryfallCard({
        id: "forest-1",
        name: "Forest",
        type_line: "Basic Land — Forest",
        cmc: 0,
        mana_cost: "",
      });
      await useDeckStore.getState().addToMaybeboard(forest);
      await useDeckStore.getState().addToMaybeboard({ ...forest, id: "forest-2" });

      const deck = useDeckStore.getState().decks["deck-1"];
      expect(deck.maybeboard).toHaveLength(2);
      expect(deck.cards).toHaveLength(2);
    });

    it("does nothing when no active deck", async () => {
      useDeckStore.setState({ activeDeckId: null });
      const card = makeScryfallCard();
      await useDeckStore.getState().addToMaybeboard(card);
      // No crash, nothing mutated
      expect(useDeckStore.getState().decks["deck-1"].maybeboard).toHaveLength(0);
    });
  });

  // ── removeFromMaybeboard ───────────────────────────────────────────────────

  describe("removeFromMaybeboard", () => {
    it("removes a card from maybeboard by id", async () => {
      const deck = useDeckStore.getState().decks["deck-1"];
      const card = makeDeckCard("maybe-1", "Lightning Bolt");
      useDeckStore.setState({
        decks: { "deck-1": { ...deck, maybeboard: [card] } },
      });

      await useDeckStore.getState().removeFromMaybeboard("maybe-1");

      const updated = useDeckStore.getState().decks["deck-1"];
      expect(updated.maybeboard).toHaveLength(0);
    });

    it("does not affect main deck cards", async () => {
      const deck = useDeckStore.getState().decks["deck-1"];
      const deckCard = makeDeckCard("main-1", "Counterspell");
      const maybeCard = makeDeckCard("maybe-1", "Lightning Bolt");
      useDeckStore.setState({
        decks: { "deck-1": { ...deck, cards: [deckCard], maybeboard: [maybeCard] } },
      });

      await useDeckStore.getState().removeFromMaybeboard("maybe-1");

      const updated = useDeckStore.getState().decks["deck-1"];
      expect(updated.cards).toHaveLength(1);
      expect(updated.maybeboard).toHaveLength(0);
    });
  });

  // ── moveToMaybeboard ───────────────────────────────────────────────────────

  describe("moveToMaybeboard", () => {
    it("moves a card from main deck to maybeboard", async () => {
      const deck = useDeckStore.getState().decks["deck-1"];
      const card = makeDeckCard("main-1", "Counterspell");
      useDeckStore.setState({
        decks: { "deck-1": { ...deck, cards: [card] } },
      });

      await useDeckStore.getState().moveToMaybeboard("main-1");

      const updated = useDeckStore.getState().decks["deck-1"];
      expect(updated.cards).toHaveLength(1);
      expect(updated.cards[0].zone).toBe("maybeboard");
      expect(updated.maybeboard).toHaveLength(1);
      expect(updated.maybeboard[0].name).toBe("Counterspell");
    });

    it("does nothing if card not found in main deck", async () => {
      await useDeckStore.getState().moveToMaybeboard("nonexistent-id");
      const deck = useDeckStore.getState().decks["deck-1"];
      expect(deck.cards).toHaveLength(0);
      expect(deck.maybeboard).toHaveLength(0);
    });
  });

  // ── moveToDeck ─────────────────────────────────────────────────────────────

  describe("moveToDeck", () => {
    it("moves a card from maybeboard to main deck", async () => {
      const deck = useDeckStore.getState().decks["deck-1"];
      const card = makeDeckCard("maybe-1", "Swords to Plowshares");
      useDeckStore.setState({
        decks: { "deck-1": { ...deck, maybeboard: [card] } },
      });

      await useDeckStore.getState().moveToDeck("maybe-1");

      const updated = useDeckStore.getState().decks["deck-1"];
      expect(updated.maybeboard).toHaveLength(0);
      expect(updated.cards).toHaveLength(1);
      expect(updated.cards[0].name).toBe("Swords to Plowshares");
      expect(updated.cards[0].zone).toBe("main");
    });

    it("does not move if the card is already in the main deck (duplicate prevention)", async () => {
      const deck = useDeckStore.getState().decks["deck-1"];
      const mainCard = makeDeckCard("main-1", "Brainstorm");
      const maybeCard = makeDeckCard("maybe-1", "Brainstorm"); // same name
      useDeckStore.setState({
        decks: { "deck-1": { ...deck, cards: [mainCard], maybeboard: [maybeCard] } },
      });

      await useDeckStore.getState().moveToDeck("maybe-1");

      const updated = useDeckStore.getState().decks["deck-1"];
      // Card stays in maybeboard — deck already has it
      expect(updated.maybeboard).toHaveLength(1);
      expect(updated.cards).toHaveLength(1);
    });

    it("does nothing if card not found in maybeboard", async () => {
      await useDeckStore.getState().moveToDeck("nonexistent-id");
      const deck = useDeckStore.getState().decks["deck-1"];
      expect(deck.cards).toHaveLength(0);
      expect(deck.maybeboard).toHaveLength(0);
    });
  });

  // ── round-trip ─────────────────────────────────────────────────────────────

  describe("round-trip: add → move to deck → move to maybeboard", () => {
    it("can cycle a card between maybeboard and deck", async () => {
      const card = makeScryfallCard({ id: "sol-ring", name: "Sol Ring" });
      await useDeckStore.getState().addToMaybeboard(card);

      // ID was updated to the DB-saved id
      const { decks } = useDeckStore.getState();
      const dbId = decks["deck-1"].maybeboard[0].id;

      await useDeckStore.getState().moveToDeck(dbId);
      expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(1);
      expect(useDeckStore.getState().decks["deck-1"].maybeboard).toHaveLength(0);

      const deckCardId = useDeckStore.getState().decks["deck-1"].cards[0].id;
      await useDeckStore.getState().moveToMaybeboard(deckCardId);
      expect(useDeckStore.getState().decks["deck-1"].cards).toHaveLength(1);
      expect(useDeckStore.getState().decks["deck-1"].cards[0].zone).toBe("maybeboard");
      expect(useDeckStore.getState().decks["deck-1"].maybeboard).toHaveLength(1);
    });
  });
});
