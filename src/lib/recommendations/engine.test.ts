import { describe, it, expect } from "vitest";
import {
  findMissingMetaCards,
  findCrossDeckBudgetSavings,
  detectScatteredSynergies,
  groupCardsByCommander,
} from "./engine";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(id: string, name: string, price: number | null = 5, typeLine = "Creature"): DeckCard {
  return {
    id, name, manaCost: "", cmc: 2, typeLine,
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price, imageUri: "", artCropUri: "",
    category: "creature", quantity: 1, zone: "main", scryfallId: id,
  };
}

function makeDeck(id: string, cards: DeckCard[], tags: string[] = [], commanderName = "Test Commander"): Deck {
  return {
    id, name: `Deck ${id}`, description: "",
    commander: makeCard(`cmd-${id}`, commanderName),
    partner: null, companion: null, pairingType: "none",
    cards, maybeboard: [], format: "commander",
    targetBracket: 3, manualBracket: null, budget: null,
    tags, shareToken: null, shareEnabled: false,
    isPublic: false, isAIGenerated: false,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

// ─── Missing meta cards ───────────────────────────────────────────────────
describe("findMissingMetaCards", () => {
  it("finds cards that appear in meta but not in user decks", () => {
    const userDecks = [
      makeDeck("d1", [makeCard("c1", "Sol Ring")]),
      makeDeck("d2", [makeCard("c1", "Sol Ring")]),
    ];
    const metaCards = [
      { scryfallId: "c1", name: "Sol Ring", metaPercentage: 90 },
      { scryfallId: "c2", name: "Rhystic Study", metaPercentage: 75 },
    ];

    const missing = findMissingMetaCards(userDecks, metaCards);

    expect(missing.length).toBeGreaterThan(0);
    expect(missing[0].name).toBe("Rhystic Study");
  });

  it("returns empty when all meta cards are present", () => {
    const userDecks = [
      makeDeck("d1", [makeCard("c1", "Sol Ring"), makeCard("c2", "Rhystic Study")]),
    ];
    const metaCards = [
      { scryfallId: "c1", name: "Sol Ring", metaPercentage: 90 },
      { scryfallId: "c2", name: "Rhystic Study", metaPercentage: 75 },
    ];

    const missing = findMissingMetaCards(userDecks, metaCards);
    expect(missing).toHaveLength(0);
  });

  it("sorts by meta percentage descending", () => {
    const userDecks = [makeDeck("d1", [])];
    const metaCards = [
      { scryfallId: "c1", name: "Cheap", metaPercentage: 30 },
      { scryfallId: "c2", name: "Popular", metaPercentage: 90 },
    ];

    const missing = findMissingMetaCards(userDecks, metaCards);
    expect(missing[0].metaPercentage).toBe(90);
  });
});

// ─── Cross-deck budget savings ────────────────────────────────────────────
describe("findCrossDeckBudgetSavings", () => {
  it("finds expensive cards appearing in multiple decks", () => {
    const expCard = makeCard("c1", "Rhystic Study", 25);
    const decks = [
      makeDeck("d1", [expCard]),
      makeDeck("d2", [expCard]),
      makeDeck("d3", [expCard]),
    ];

    const savings = findCrossDeckBudgetSavings(decks, 10);

    expect(savings.length).toBeGreaterThan(0);
    expect(savings[0].cardName).toBe("Rhystic Study");
    expect(savings[0].deckCount).toBe(3);
  });

  it("only includes cards above price threshold", () => {
    const cheap = makeCard("c1", "Cheap Card", 2);
    const expensive = makeCard("c2", "Expensive Card", 30);
    const decks = [
      makeDeck("d1", [cheap, expensive]),
      makeDeck("d2", [cheap, expensive]),
    ];

    const savings = findCrossDeckBudgetSavings(decks, 10);
    expect(savings.every((s) => s.currentPrice >= 10)).toBe(true);
  });

  it("calculates total savings across all decks", () => {
    const expCard = makeCard("c1", "Card", 20);
    const decks = [makeDeck("d1", [expCard]), makeDeck("d2", [expCard])];

    const savings = findCrossDeckBudgetSavings(decks, 10);
    const first = savings[0];
    expect(first.totalSavingsPotential).toBeGreaterThan(0);
  });

  it("returns empty when all cards are below threshold", () => {
    const cheap = makeCard("c1", "Cheap", 2);
    const decks = [makeDeck("d1", [cheap])];

    const savings = findCrossDeckBudgetSavings(decks, 10);
    expect(savings).toHaveLength(0);
  });
});

// ─── Scattered synergies ──────────────────────────────────────────────────
describe("detectScatteredSynergies", () => {
  it("detects cards with same type scattered across multiple decks", () => {
    const equip1 = makeCard("e1", "Sword of Fire", 20, "Artifact — Equipment");
    const equip2 = makeCard("e2", "Lightning Greaves", 15, "Artifact — Equipment");
    const equip3 = makeCard("e3", "Swiftfoot Boots", 5, "Artifact — Equipment");

    const decks = [
      makeDeck("d1", [equip1]),
      makeDeck("d2", [equip2]),
      makeDeck("d3", [equip3]),
    ];

    const synergies = detectScatteredSynergies(decks);
    const equipSynergy = synergies.find((s) => s.pattern === "Equipment");
    expect(equipSynergy).toBeDefined();
    expect(equipSynergy?.deckCount).toBe(3);
  });

  it("returns empty for single deck with single type", () => {
    const decks = [makeDeck("d1", [makeCard("c1", "Forest", 0.1, "Basic Land")])];
    const synergies = detectScatteredSynergies(decks);
    // Only appears in 1 deck — no cross-deck synergy
    expect(synergies.every((s) => s.deckCount < 2)).toBe(true);
  });
});

// ─── Group by commander ───────────────────────────────────────────────────
describe("groupCardsByCommander", () => {
  it("groups decks by commander name", () => {
    const decks = [
      makeDeck("d1", [makeCard("c1", "Card1")], [], "Atraxa"),
      makeDeck("d2", [makeCard("c2", "Card2")], [], "Atraxa"),
      makeDeck("d3", [makeCard("c3", "Card3")], [], "Kenrith"),
    ];

    const grouped = groupCardsByCommander(decks);
    expect(grouped["Atraxa"]).toHaveLength(2);
    expect(grouped["Kenrith"]).toHaveLength(1);
  });

  it("returns empty object for empty decks", () => {
    expect(groupCardsByCommander([])).toEqual({});
  });
});
