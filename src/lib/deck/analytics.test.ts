import { describe, it, expect } from "vitest";
import {
  aggregateDeckStats,
  getFormatDistribution,
  getArchetypeDistribution,
  getBudgetDistribution,
  getRecentlyModified,
  BUDGET_TIERS,
} from "./analytics";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(id: string, price: number | null = 5): DeckCard {
  return {
    id, name: "Card", manaCost: "", cmc: 1, typeLine: "Creature",
    oracleText: "", colorIdentity: [], isGameChanger: false, isBanned: false,
    price, imageUri: "", artCropUri: "", category: "creature",
    quantity: 1, zone: "main", scryfallId: id,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: `deck-${Math.random()}`, name: "Test Deck", description: "",
    commander: makeCard("cmd"), partner: null, companion: null,
    pairingType: "none", cards: Array.from({ length: 99 }, (_, i) => makeCard(`c${i}`, 2)),
    maybeboard: [], format: "commander", cardCount: 0, targetBracket: 3, manualBracket: null,
    budget: null, tags: [], shareToken: null, shareEnabled: false,
    isPublic: false, isAIGenerated: false,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Aggregate deck stats ────────────────────────────────────────────────
describe("aggregateDeckStats", () => {
  it("counts total decks", () => {
    const decks = [makeDeck(), makeDeck(), makeDeck()];
    const stats = aggregateDeckStats(decks);
    expect(stats.totalDecks).toBe(3);
  });

  it("calculates total value across all decks", () => {
    const decks = [
      makeDeck({ cards: [makeCard("c1", 10), makeCard("c2", 20)] }),
      makeDeck({ cards: [makeCard("c3", 15)] }),
    ];
    const stats = aggregateDeckStats(decks);
    expect(stats.totalValue).toBe(45);
  });

  it("calculates average deck cost", () => {
    const decks = [
      makeDeck({ cards: [makeCard("c1", 100)] }),
      makeDeck({ cards: [makeCard("c2", 200)] }),
    ];
    const stats = aggregateDeckStats(decks);
    expect(stats.averageDeckCost).toBe(150);
  });

  it("finds favorite archetype (most common tag)", () => {
    const decks = [
      makeDeck({ tags: ["Combo"] }),
      makeDeck({ tags: ["Combo"] }),
      makeDeck({ tags: ["Control"] }),
    ];
    const stats = aggregateDeckStats(decks);
    expect(stats.favoriteArchetype).toBe("Combo");
  });

  it("returns null favoriteArchetype for decks with no tags", () => {
    const decks = [makeDeck(), makeDeck()];
    const stats = aggregateDeckStats(decks);
    expect(stats.favoriteArchetype).toBeNull();
  });

  it("handles empty deck list", () => {
    const stats = aggregateDeckStats([]);
    expect(stats.totalDecks).toBe(0);
    expect(stats.totalValue).toBe(0);
    expect(stats.averageDeckCost).toBe(0);
  });
});

// ─── Format distribution ─────────────────────────────────────────────────
describe("getFormatDistribution", () => {
  it("groups decks by format", () => {
    const decks = [
      makeDeck({ format: "commander" }),
      makeDeck({ format: "commander" }),
      makeDeck({ format: "brawl" }),
    ];
    const dist = getFormatDistribution(decks);
    expect(dist["commander"]).toBe(2);
    expect(dist["brawl"]).toBe(1);
  });

  it("calculates percentages", () => {
    const decks = [
      makeDeck({ format: "commander" }),
      makeDeck({ format: "commander" }),
      makeDeck({ format: "brawl" }),
    ];
    const dist = getFormatDistribution(decks);
    expect(dist["commander"]).toBe(2);
  });

  it("returns empty object for empty decks", () => {
    const dist = getFormatDistribution([]);
    expect(dist).toEqual({});
  });
});

// ─── Archetype distribution ──────────────────────────────────────────────
describe("getArchetypeDistribution", () => {
  it("groups decks by archetype tag", () => {
    const decks = [
      makeDeck({ tags: ["Combo"] }),
      makeDeck({ tags: ["Combo"] }),
      makeDeck({ tags: ["Control"] }),
      makeDeck({ tags: [] }),
    ];
    const dist = getArchetypeDistribution(decks);
    expect(dist["Combo"]).toBe(2);
    expect(dist["Control"]).toBe(1);
  });

  it("handles decks with multiple tags", () => {
    const decks = [
      makeDeck({ tags: ["Combo", "Control"] }),
    ];
    const dist = getArchetypeDistribution(decks);
    expect(dist["Combo"]).toBe(1);
    expect(dist["Control"]).toBe(1);
  });

  it("returns empty object for decks without tags", () => {
    const decks = [makeDeck({ tags: [] })];
    const dist = getArchetypeDistribution(decks);
    expect(dist).toEqual({});
  });
});

// ─── Budget distribution ─────────────────────────────────────────────────
describe("getBudgetDistribution", () => {
  it("categorizes decks by budget tier", () => {
    const decks = [
      makeDeck({ cards: [makeCard("c1", 50)] }),    // Budget (< €100)
      makeDeck({ cards: [makeCard("c2", 200)] }),   // Mid-range
      makeDeck({ cards: [makeCard("c3", 400)] }),   // Optimized
      makeDeck({ cards: [makeCard("c4", 800)] }),   // cEDH
    ];
    const dist = getBudgetDistribution(decks);
    expect(dist["Budget"]).toBe(1);
    expect(dist["Mid-range"]).toBe(1);
    expect(dist["Optimized"]).toBe(1);
    expect(dist["cEDH"]).toBe(1);
  });

  it("exports BUDGET_TIERS constants", () => {
    expect(BUDGET_TIERS).toBeDefined();
    expect(BUDGET_TIERS.BUDGET_MAX).toBe(100);
    expect(BUDGET_TIERS.MID_MAX).toBe(300);
    expect(BUDGET_TIERS.OPTIMIZED_MAX).toBe(600);
  });
});

// ─── Recently modified ───────────────────────────────────────────────────
describe("getRecentlyModified", () => {
  it("returns most recently modified decks", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const twoDaysAgo = new Date(now.getTime() - 172800000);

    const decks = [
      makeDeck({ id: "old", updatedAt: twoDaysAgo }),
      makeDeck({ id: "recent", updatedAt: now }),
      makeDeck({ id: "yesterday", updatedAt: yesterday }),
    ];
    const recent = getRecentlyModified(decks, 2);
    expect(recent[0].id).toBe("recent");
    expect(recent[1].id).toBe("yesterday");
  });

  it("limits result count", () => {
    const decks = Array.from({ length: 10 }, () => makeDeck());
    const recent = getRecentlyModified(decks, 3);
    expect(recent).toHaveLength(3);
  });
});
