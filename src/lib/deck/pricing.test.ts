import { describe, it, expect } from "vitest";
import {
  calculateDeckPrice,
  getPriceBreakdown,
  suggestBudgetReductions,
  getCardsSortedByPrice,
  findCheaperAlternatives,
  type DeckPricing as _DeckPricing,
  type PriceBreakdown as _PriceBreakdown,
} from "./pricing";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(
  id: string,
  name = "Test",
  price: number | null = 5,
  typeLine = "Creature"
): DeckCard {
  return {
    id,
    name,
    manaCost: "",
    cmc: 1,
    typeLine,
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main",
    scryfallId: id,
  };
}

// ─── Price calculation ─────────────────────────────────────────────────────
describe("calculateDeckPrice", () => {
  it("calculates total deck price from cards", () => {
    const cards = [makeCard("c1", "Card 1", 10), makeCard("c2", "Card 2", 20)];
    const pricing = calculateDeckPrice(cards);

    expect(pricing.totalPrice).toBe(30);
    expect(pricing.cardCount).toBe(2);
  });

  it("excludes cards with no price data", () => {
    const cards = [
      makeCard("c1", "Card 1", 10),
      makeCard("c2", "Card 2", null),
    ];
    const pricing = calculateDeckPrice(cards);

    expect(pricing.totalPrice).toBe(10);
    expect(pricing.cardsWithoutPrice).toBe(1);
  });

  it("calculates average price", () => {
    const cards = [
      makeCard("c1", "Card 1", 10),
      makeCard("c2", "Card 2", 20),
      makeCard("c3", "Card 3", 30),
    ];
    const pricing = calculateDeckPrice(cards);

    expect(pricing.averagePrice).toBeCloseTo(20);
  });

  it("finds most and least expensive cards", () => {
    const cards = [
      makeCard("c1", "Cheap", 1),
      makeCard("c2", "Mid", 5),
      makeCard("c3", "Expensive", 50),
    ];
    const pricing = calculateDeckPrice(cards);

    expect(pricing.mostExpensiveCard?.price).toBe(50);
    expect(pricing.cheapestCard?.price).toBe(1);
  });

  it("handles all cards with no price", () => {
    const cards = [
      makeCard("c1", "Card 1", null),
      makeCard("c2", "Card 2", null),
    ];
    const pricing = calculateDeckPrice(cards);

    expect(pricing.totalPrice).toBe(0);
    expect(pricing.cardsWithoutPrice).toBe(2);
    expect(pricing.averagePrice).toBe(0);
  });
});

// ─── Price breakdown by type ───────────────────────────────────────────────
describe("getPriceBreakdown", () => {
  it("breaks down price by card type", () => {
    const cards = [
      makeCard("c1", "Creature 1", 10, "Creature"),
      makeCard("c2", "Creature 2", 5, "Creature"),
      makeCard("c3", "Instant", 8, "Instant"),
      makeCard("c4", "Land", 3, "Land"),
    ];
    const breakdown = getPriceBreakdown(cards);

    expect(breakdown.byType).toBeDefined();
    expect(breakdown.byType["Creature"]).toBe(15);
    expect(breakdown.byType["Instant"]).toBe(8);
    expect(breakdown.byType["Land"]).toBe(3);
  });

  it("calculates percentages correctly", () => {
    const cards = [
      makeCard("c1", "A", 50, "Creature"),
      makeCard("c2", "B", 50, "Spell"),
    ];
    const breakdown = getPriceBreakdown(cards);

    expect(breakdown.total).toBe(100);
    expect(breakdown.percentages["Creature"]).toBeCloseTo(50);
    expect(breakdown.percentages["Spell"]).toBeCloseTo(50);
  });

  it("handles zero total price", () => {
    const cards = [
      makeCard("c1", "A", null),
      makeCard("c2", "B", null),
    ];
    const breakdown = getPriceBreakdown(cards);

    expect(breakdown.total).toBe(0);
    expect(breakdown.byType).toEqual({});
  });
});

// ─── Budget reduction suggestions ──────────────────────────────────────────
describe("suggestBudgetReductions", () => {
  it("suggests replacing expensive cards with cheaper ones", () => {
    const cards = [
      makeCard("c1", "Expensive", 50),
      makeCard("c2", "Mid", 10),
      makeCard("c3", "Cheap", 2),
    ];
    const targetBudget = 30;

    const suggestions = suggestBudgetReductions(cards, targetBudget);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].savingsAmount).toBeGreaterThan(0);
  });

  it("returns empty suggestions if already under budget", () => {
    const cards = [
      makeCard("c1", "Card 1", 5),
      makeCard("c2", "Card 2", 5),
    ];
    const targetBudget = 100;

    const suggestions = suggestBudgetReductions(cards, targetBudget);

    expect(suggestions).toHaveLength(0);
  });

  it("sorts suggestions by savings (most impactful first)", () => {
    const cards = [
      makeCard("c1", "Very Expensive", 100),
      makeCard("c2", "Moderately Expensive", 30),
      makeCard("c3", "Cheap", 5),
    ];
    const targetBudget = 50;

    const suggestions = suggestBudgetReductions(cards, targetBudget);

    if (suggestions.length > 1) {
      expect(suggestions[0].savingsAmount).toBeGreaterThanOrEqual(
        suggestions[1].savingsAmount
      );
    }
  });
});

// ─── Card sorting by price ────────────────────────────────────────────────
describe("getCardsSortedByPrice", () => {
  it("sorts cards by price descending", () => {
    const cards = [
      makeCard("c1", "Card 1", 5),
      makeCard("c2", "Card 2", 20),
      makeCard("c3", "Card 3", 10),
    ];

    const sorted = getCardsSortedByPrice(cards, "desc");

    expect(sorted[0].price).toBe(20);
    expect(sorted[1].price).toBe(10);
    expect(sorted[2].price).toBe(5);
  });

  it("sorts cards by price ascending", () => {
    const cards = [
      makeCard("c1", "Card 1", 20),
      makeCard("c2", "Card 2", 5),
      makeCard("c3", "Card 3", 10),
    ];

    const sorted = getCardsSortedByPrice(cards, "asc");

    expect(sorted[0].price).toBe(5);
    expect(sorted[1].price).toBe(10);
    expect(sorted[2].price).toBe(20);
  });

  it("excludes cards without price", () => {
    const cards = [
      makeCard("c1", "Card 1", 10),
      makeCard("c2", "Card 2", null),
      makeCard("c3", "Card 3", 5),
    ];

    const sorted = getCardsSortedByPrice(cards, "desc");

    expect(sorted).toHaveLength(2);
    expect(sorted.every((c) => c.price !== null)).toBe(true);
  });
});

// ─── Find cheaper alternatives ────────────────────────────────────────────
describe("findCheaperAlternatives", () => {
  it("finds cards with similar function but lower price", () => {
    const expensiveCard = makeCard("c1", "Rhystic Study", 25, "Enchantment");
    const alternatives = [
      makeCard("a1", "Mystic Remora", 2, "Enchantment"),
      makeCard("a2", "Smothering Tithe", 15, "Enchantment"),
    ];

    const results = findCheaperAlternatives(expensiveCard, alternatives);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((c) => (c.price ?? Infinity) < (expensiveCard.price ?? 0))).toBe(true);
  });

  it("returns empty if no cheaper alternatives exist", () => {
    const card = makeCard("c1", "Card", 5);
    const alternatives = [
      makeCard("a1", "Expensive", 10),
      makeCard("a2", "VeryExpensive", 20),
    ];

    const results = findCheaperAlternatives(card, alternatives);

    expect(results).toHaveLength(0);
  });

  it("prioritizes same type alternatives", () => {
    const creature = makeCard("c1", "Creature", 50, "Creature");
    const alternatives = [
      makeCard("a1", "Other Creature", 10, "Creature"),
      makeCard("a2", "Spell", 5, "Instant"),
    ];

    const results = findCheaperAlternatives(creature, alternatives);

    if (results.length > 0) {
      expect(results[0].typeLine).toBe("Creature");
    }
  });
});

// ─── Edge cases ────────────────────────────────────────────────────────────
describe("edge cases", () => {
  it("handles deck with quantity > 1", () => {
    const card = { ...makeCard("c1", "Card", 5), quantity: 3 };
    const cards = [card];
    const pricing = calculateDeckPrice(cards);

    expect(pricing.totalPrice).toBe(15);
  });

  it("handles very large price values", () => {
    const cards = [makeCard("c1", "Card", 999.99)];
    const pricing = calculateDeckPrice(cards);

    expect(pricing.totalPrice).toBe(999.99);
  });

  it("handles empty card list", () => {
    const pricing = calculateDeckPrice([]);

    expect(pricing.totalPrice).toBe(0);
    expect(pricing.cardCount).toBe(0);
  });
});
