import { describe, it, expect } from "vitest";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeDeckCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "test-id",
    name: "Test Card",
    manaCost: "{2}{G}",
    cmc: 3,
    typeLine: "Creature — Elf",
    oracleText: "",
    colorIdentity: ["G"],
    isGameChanger: false,
    isBanned: false,
    price: 1.0,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    ...overrides,
  };
}

function makeCommander(): DeckCard {
  return makeDeckCard({
    id: "commander-id",
    name: "Test Commander",
    category: "commander",
    cmc: 4,
    typeLine: "Legendary Creature — Human Wizard",
    colorIdentity: ["G", "U"],
  });
}

function emptyDeck(): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: makeCommander(),
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    targetBracket: 2,
    budget: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("computeDeckStats", () => {
  it("counts commander in totalCards", () => {
    const deck = emptyDeck();
    const stats = computeDeckStats(deck);
    expect(stats.totalCards).toBe(1); // just commander
  });

  it("counts main deck cards", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Card A", category: "creature" }),
      makeDeckCard({ id: "c2", name: "Card B", category: "land", cmc: 0, quantity: 1 }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.totalCards).toBe(3); // commander + 2 cards
  });

  it("does NOT count maybeboard cards in totalCards", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Card A", category: "creature" }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe Card", category: "creature" }),
      makeDeckCard({ id: "m2", name: "Maybe Land", category: "land", cmc: 0 }),
    ];
    const stats = computeDeckStats(deck);
    // Should be 2 (commander + Card A), NOT 4
    expect(stats.totalCards).toBe(2);
  });

  it("does NOT count maybeboard cards in creature count", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Deck Creature", category: "creature" }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe Creature", category: "creature" }),
    ];
    const stats = computeDeckStats(deck);
    // Only the deck creature (maybeboard creature excluded)
    expect(stats.creatures).toBe(1);
  });

  it("does NOT count maybeboard cards in totalPrice", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Deck Card", price: 10, category: "creature" }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe Card", price: 50, category: "creature" }),
    ];
    const stats = computeDeckStats(deck);
    // Commander (1.0) + Deck Card (10.0) = 11.0; Maybe Card (50.0) excluded
    expect(stats.totalPrice).toBe(11.0);
  });

  it("does NOT count maybeboard lands in lands count", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "l1", name: "Forest", category: "land", cmc: 0, colorIdentity: ["G"] }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "ml1", name: "Maybe Forest", category: "land", cmc: 0, colorIdentity: ["G"] }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.lands).toBe(1);
  });

  it("does NOT count maybeboard Game Changers", () => {
    const deck = emptyDeck();
    deck.cards = [];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe GC", category: "creature", isGameChanger: true }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.gameChangersCount).toBe(0);
    expect(stats.gameChangersList).toHaveLength(0);
  });

  it("does NOT include maybeboard banned cards in violations", () => {
    const deck = emptyDeck();
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Banned Maybe", category: "creature", isBanned: true }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.bannedCards).not.toContain("Banned Maybe");
  });
});
