import { describe, it, expect } from "vitest";
import {
  validateCardForDeck,
  validateDeck,
  checkColorIdentity,
  detectGameChanger,
} from "@/lib/deck/validation";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "test",
    name: "Test Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card-1",
    name: "Lightning Bolt",
    manaCost: "{R}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "Lightning Bolt deals 3 damage to any target.",
    colorIdentity: ["R"],
    isGameChanger: false,
    isBanned: false,
    price: 0.5,
    imageUri: "https://example.com/card.jpg",
    artCropUri: "https://example.com/art.jpg",
    category: "removal",
    quantity: 1,
    zone: "main" as const,
    ...overrides,
  };
}

function makeCommander(colors: string[]): DeckCard {
  return makeCard({
    id: "commander",
    name: "Atraxa, Praetors' Voice",
    typeLine: "Legendary Creature — Phyrexian Angel Horror",
    colorIdentity: colors,
    category: "commander",
  });
}

describe("validateCardForDeck", () => {
  it("allows a legal card in a matching commander identity", () => {
    const deck = makeDeck({
      commander: makeCommander(["W", "U", "B", "G"]),
    });
    const card = makeCard({ colorIdentity: ["U"] });
    const result = validateCardForDeck(card, deck);
    expect(result.canAdd).toBe(true);
    expect(result.isColorViolation).toBe(false);
  });

  it("rejects a card with color outside commander identity", () => {
    const deck = makeDeck({
      commander: makeCommander(["W", "U"]),
    });
    const card = makeCard({ name: "Llanowar Elves", colorIdentity: ["G"] });
    const result = validateCardForDeck(card, deck);
    expect(result.canAdd).toBe(false);
    expect(result.isColorViolation).toBe(true);
  });

  it("rejects a banned card", () => {
    const deck = makeDeck();
    const card = makeCard({ name: "Griselbrand", isBanned: true });
    const result = validateCardForDeck(card, deck);
    expect(result.canAdd).toBe(false);
    expect(result.isBanned).toBe(true);
  });

  it("flags game changer cards", () => {
    const deck = makeDeck();
    const card = makeCard({ name: "Sol Ring", isGameChanger: true });
    const result = validateCardForDeck(card, deck);
    expect(result.isGameChanger).toBe(true);
  });

  it("rejects duplicate non-basic cards", () => {
    const existing = makeCard({ id: "orig", name: "Sol Ring" });
    const deck = makeDeck({ cards: [existing] });
    const duplicate = makeCard({ id: "dup", name: "Sol Ring" });
    const result = validateCardForDeck(duplicate, deck);
    expect(result.canAdd).toBe(false);
  });

  it("allows duplicate basic lands", () => {
    const existing = makeCard({
      id: "orig",
      name: "Island",
      typeLine: "Basic Land — Island",
    });
    const deck = makeDeck({ cards: [existing] });
    const another = makeCard({
      id: "dup",
      name: "Island",
      typeLine: "Basic Land — Island",
    });
    const result = validateCardForDeck(another, deck);
    expect(result.canAdd).toBe(true);
  });
});

describe("validateDeck", () => {
  it("reports missing commander", () => {
    const deck = makeDeck();
    const result = validateDeck(deck);
    expect(result.errors.some((e) => e.includes("commander"))).toBe(true);
  });

  it("reports incomplete deck", () => {
    const deck = makeDeck({ commander: makeCommander(["R"]) });
    const result = validateDeck(deck);
    expect(result.warnings.some((w) => w.includes("100"))).toBe(true);
  });

  it("reports banned cards", () => {
    const deck = makeDeck({
      commander: makeCommander(["R"]),
      cards: [makeCard({ name: "Griselbrand", isBanned: true })],
    });
    const result = validateDeck(deck);
    expect(result.errors.some((e) => e.includes("Griselbrand"))).toBe(true);
  });

  it("reports color identity violations", () => {
    const deck = makeDeck({
      commander: makeCommander(["W"]),
      cards: [makeCard({ name: "Lightning Bolt", colorIdentity: ["R"] })],
    });
    const result = validateDeck(deck);
    expect(result.errors.some((e) => e.includes("Lightning Bolt"))).toBe(true);
  });

  it("warns about game changers", () => {
    const gcCards = Array.from({ length: 2 }, (_, i) =>
      makeCard({ id: `gc-${i}`, name: `GC Card ${i}`, isGameChanger: true })
    );
    const deck = makeDeck({
      commander: makeCommander([]),
      cards: gcCards,
    });
    const result = validateDeck(deck);
    expect(result.warnings.some((w) => w.includes("Game Changer"))).toBe(true);
  });
});

describe("checkColorIdentity", () => {
  it("returns true when all card colors are within commander colors", () => {
    expect(checkColorIdentity(["U", "W"], ["W", "U", "B"])).toBe(true);
  });

  it("returns false when card has colors outside commander", () => {
    expect(checkColorIdentity(["R"], ["W", "U"])).toBe(false);
  });

  it("returns true for colorless cards", () => {
    expect(checkColorIdentity([], ["W", "U"])).toBe(true);
  });
});

describe("detectGameChanger", () => {
  it("detects take an extra turn as game changer", () => {
    expect(detectGameChanger("Take an extra turn after this one.")).toBe(true);
  });

  it("detects win the game as game changer", () => {
    expect(detectGameChanger("You win the game.")).toBe(true);
  });

  it("does not flag regular spells", () => {
    expect(detectGameChanger("Lightning Bolt deals 3 damage to any target.")).toBe(false);
  });
});
