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
    zone: "main",
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
    zone: "main",
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
      makeDeckCard({ id: "c1", name: "Card A", category: "creature", zone: "main" }),
      makeDeckCard({ id: "c2", name: "Card B", category: "land", cmc: 0, quantity: 1, zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.totalCards).toBe(3); // commander + 2 cards
  });

  it("does NOT count maybeboard cards in totalCards", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Card A", category: "creature", zone: "main" }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe Card", category: "creature", zone: "maybeboard" }),
      makeDeckCard({ id: "m2", name: "Maybe Land", category: "land", cmc: 0, zone: "maybeboard" }),
    ];
    const stats = computeDeckStats(deck);
    // Should be 2 (commander + Card A), NOT 4
    expect(stats.totalCards).toBe(2);
  });

  it("does NOT count maybeboard cards in creature count", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Deck Creature", category: "creature", zone: "main" }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe Creature", category: "creature", zone: "maybeboard" }),
    ];
    const stats = computeDeckStats(deck);
    // Only the deck creature (maybeboard creature excluded)
    expect(stats.creatures).toBe(1);
  });

  it("does NOT count maybeboard cards in totalPrice", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Deck Card", price: 10, category: "creature", zone: "main" }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe Card", price: 50, category: "creature", zone: "maybeboard" }),
    ];
    const stats = computeDeckStats(deck);
    // Commander (1.0) + Deck Card (10.0) = 11.0; Maybe Card (50.0) excluded
    expect(stats.totalPrice).toBe(11.0);
  });

  it("does NOT count maybeboard lands in lands count", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "l1", name: "Forest", category: "land", cmc: 0, colorIdentity: ["G"], zone: "main" }),
    ];
    deck.maybeboard = [
      makeDeckCard({ id: "ml1", name: "Maybe Forest", category: "land", cmc: 0, colorIdentity: ["G"], zone: "maybeboard" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.lands).toBe(1);
  });

  it("does NOT count maybeboard Game Changers", () => {
    const deck = emptyDeck();
    deck.cards = [];
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Maybe GC", category: "creature", isGameChanger: true, zone: "maybeboard" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.gameChangersCount).toBe(0);
    expect(stats.gameChangersList).toHaveLength(0);
  });

  it("does NOT include maybeboard banned cards in violations", () => {
    const deck = emptyDeck();
    deck.maybeboard = [
      makeDeckCard({ id: "m1", name: "Banned Maybe", category: "creature", isBanned: true, zone: "maybeboard" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.bannedCards).not.toContain("Banned Maybe");
  });

  it("computes avgCmc correctly for main cards only", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Cheap Card", cmc: 1, category: "creature", zone: "main" }),
      makeDeckCard({ id: "c2", name: "Expensive Card", cmc: 5, category: "creature", zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.avgCmc).toBe(3); // (1+5)/2
  });

  it("avgCmc is 0 when deck has only lands and commander", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "l1", name: "Forest", category: "land", cmc: 0, zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    // No non-land main cards → avgCmc = 0
    expect(stats.avgCmc).toBe(0);
  });

  it("includes commander Game Changers in count", () => {
    const deck = emptyDeck();
    deck.commander = makeDeckCard({ id: "cmd", name: "GC Commander", category: "commander", isGameChanger: true, zone: "main" });
    deck.cards = [];
    const stats = computeDeckStats(deck);
    expect(stats.gameChangersCount).toBe(1);
    expect(stats.gameChangersList).toContain("GC Commander");
  });

  it("counts board wipes separately from removal", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "r1", name: "Path to Exile", category: "removal", zone: "main" }),
      makeDeckCard({ id: "r2", name: "Swords to Plowshares", category: "removal", zone: "main" }),
      makeDeckCard({ id: "w1", name: "Wrath of God", category: "boardWipe", zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.removal).toBe(2);
    expect(stats.boardWipes).toBe(1);
  });

  it("tracks overBudgetCards when budget is set", () => {
    const deck = { ...emptyDeck(), budget: 5 };
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Cheap Card", price: 1.0, zone: "main" }),
      makeDeckCard({ id: "c2", name: "Expensive Card", price: 50.0, zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.overBudgetCards).toContain("Expensive Card");
    expect(stats.overBudgetCards).not.toContain("Cheap Card");
  });

  it("overBudgetCards is empty when no budget set", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Expensive", price: 500, zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.overBudgetCards).toHaveLength(0);
  });

  it("detects color identity violations", () => {
    const deck = emptyDeck();
    // Commander is G+U; add a Red card
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Lightning Bolt", colorIdentity: ["R"], zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.colorIdentityViolations).toContain("Lightning Bolt");
  });

  it("no color identity violations when all cards match", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Simic Card", colorIdentity: ["G", "U"], zone: "main" }),
      makeDeckCard({ id: "c2", name: "Colorless Artifact", colorIdentity: [], zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.colorIdentityViolations).toHaveLength(0);
  });

  it("counts ramp and draw separately", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "r1", name: "Sol Ring", category: "ramp", zone: "main" }),
      makeDeckCard({ id: "r2", name: "Cultivate", category: "ramp", zone: "main" }),
      makeDeckCard({ id: "d1", name: "Rhystic Study", category: "draw", zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    expect(stats.ramp).toBe(2);
    expect(stats.draw).toBe(1);
  });

  it("handles deck with partner commander", () => {
    const deck = emptyDeck();
    deck.partner = makeDeckCard({ id: "partner-id", name: "Partner Card", category: "commander", colorIdentity: ["R"], zone: "main" });
    deck.cards = [
      makeDeckCard({ id: "c1", name: "Red Card", colorIdentity: ["R"], zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    // Partner's R color identity included → no violation
    expect(stats.colorIdentityViolations).not.toContain("Red Card");
    // totalCards = commander + partner + 1 card
    expect(stats.totalCards).toBe(3);
  });

  it("builds mana curve capped at 7", () => {
    const deck = emptyDeck();
    deck.cards = [
      makeDeckCard({ id: "c1", name: "High CMC", cmc: 10, category: "creature", zone: "main" }),
      makeDeckCard({ id: "c2", name: "Normal CMC", cmc: 3, category: "creature", zone: "main" }),
    ];
    const stats = computeDeckStats(deck);
    // 10 cmc gets capped to 7
    expect(stats.manaCurve[7]).toBeGreaterThanOrEqual(1);
    expect(stats.manaCurve[3]).toBeDefined();
    // No entry for 10
    expect(stats.manaCurve[10]).toBeUndefined();
  });
});
