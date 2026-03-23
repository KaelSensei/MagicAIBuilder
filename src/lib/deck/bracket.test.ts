import { describe, it, expect } from "vitest";
import { scoreBracket } from "@/lib/deck/bracket";
import type { Deck, DeckStats } from "@/lib/deck/types";

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "test-deck",
    name: "Test Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    format: "commander",
    targetBracket: 2,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeStats(overrides: Partial<DeckStats> = {}): DeckStats {
  return {
    totalCards: 100,
    lands: 37,
    creatures: 25,
    ramp: 8,
    draw: 8,
    removal: 6,
    boardWipes: 3,
    avgCmc: 3.0,
    manaCurve: { 1: 5, 2: 15, 3: 20, 4: 15, 5: 8 },
    colorDistribution: { U: 30, W: 20 },
    gameChangersCount: 0,
    gameChangersList: [],
    totalPrice: 50,
    overBudgetCards: [],
    bannedCards: [],
    colorIdentityViolations: [],
    ...overrides,
  };
}

describe("scoreBracket", () => {
  it("returns a score between 1 and 4", () => {
    const deck = makeDeck();
    const stats = makeStats();
    const result = scoreBracket(deck, stats);
    expect(result.overall).toBeGreaterThanOrEqual(1);
    expect(result.overall).toBeLessThanOrEqual(4);
  });

  it("returns bracket 1 for very casual stats (low ramp/draw, high cmc)", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 2,
      draw: 2,
      removal: 2,
      boardWipes: 0,
      avgCmc: 4.5,
      gameChangersCount: 0,
    });
    const result = scoreBracket(deck, stats);
    expect(result.overall).toBe(1);
  });

  it("forces minimum bracket 3 when game changers > 0", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 2,
      draw: 2,
      avgCmc: 4.0,
      gameChangersCount: 1,
      gameChangersList: ["Sol Ring"],
    });
    const result = scoreBracket(deck, stats);
    expect(result.overall).toBeGreaterThanOrEqual(3);
    expect(result.gameChangers).toBe(1);
  });

  it("forces minimum bracket 4 when game changers > 3", () => {
    const deck = makeDeck();
    const stats = makeStats({
      gameChangersCount: 4,
      gameChangersList: ["Sol Ring", "Demonic Tutor", "Rhystic Study", "Mana Crypt"],
    });
    const result = scoreBracket(deck, stats);
    expect(result.overall).toBe(4);
  });

  it("includes all 6 dimensions", () => {
    const deck = makeDeck();
    const stats = makeStats();
    const result = scoreBracket(deck, stats);
    const expectedKeys = ["ramp", "draw", "removal", "tutors", "winSpeed", "avgCmc"];
    for (const key of expectedKeys) {
      expect(result.dimensions).toHaveProperty(key);
      expect(result.dimensions[key as keyof typeof result.dimensions]).toBeGreaterThanOrEqual(1);
      expect(result.dimensions[key as keyof typeof result.dimensions]).toBeLessThanOrEqual(4);
    }
  });

  it("generates warnings for banned cards", () => {
    const deck = makeDeck();
    const stats = makeStats({ bannedCards: ["Griselbrand"] });
    const result = scoreBracket(deck, stats);
    expect(result.warnings.some((w) => w.includes("Griselbrand"))).toBe(true);
  });

  it("generates warnings for low ramp", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 3 });
    const result = scoreBracket(deck, stats);
    expect(result.warnings.some((w) => w.includes("ramp"))).toBe(true);
  });

  it("generates warnings for low land count", () => {
    const deck = makeDeck();
    const stats = makeStats({ lands: 28 });
    const result = scoreBracket(deck, stats);
    expect(result.warnings.some((w) => w.includes("land"))).toBe(true);
  });

  it("generates no warnings for a well-built deck", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 10,
      draw: 10,
      lands: 36,
      totalCards: 100,
    });
    const result = scoreBracket(deck, stats);
    // Should not have ramp/land/draw warnings
    expect(result.warnings.filter((w) => w.includes("ramp") || w.includes("land count")).length).toBe(0);
  });

  it("forces bracket 4 when a 2-card infinite combo is present", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 });
    const combos = [
      { id: "c1", cards: ["Chatterfang, Squirrel General", "Pitiless Plunderer"], isInfinite: true, effects: ["Infinite tokens"], uses: [], produces: [], description: "" },
    ];
    const result = scoreBracket(deck, stats, combos as import("@/lib/combos/spellbook").SpellbookVariant[]);
    expect(result.overall).toBe(4);
    expect(result.twoCardInfiniteCombos).toBe(1);
    expect(result.warnings.some((w) => w.includes("2-card combo"))).toBe(true);
  });

  it("does NOT force bracket 4 for a 3-card infinite combo", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 });
    const combos = [
      { id: "c2", cards: ["A", "B", "C"], isInfinite: true, effects: ["Infinite mana"], uses: [], produces: [], description: "" },
    ];
    const result = scoreBracket(deck, stats, combos as import("@/lib/combos/spellbook").SpellbookVariant[]);
    expect(result.twoCardInfiniteCombos).toBe(0);
    expect(result.overall).toBeLessThanOrEqual(3); // may still be low bracket
  });

  it("does NOT force bracket 4 for a non-infinite 2-card combo", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 });
    const combos = [
      { id: "c3", cards: ["A", "B"], isInfinite: false, effects: ["Draw cards"], uses: [], produces: [], description: "" },
    ];
    const result = scoreBracket(deck, stats, combos as import("@/lib/combos/spellbook").SpellbookVariant[]);
    expect(result.twoCardInfiniteCombos).toBe(0);
  });

  it("score clamps to 4 even with extreme stats", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 20,
      draw: 20,
      avgCmc: 1.0,
      gameChangersCount: 10,
    });
    const result = scoreBracket(deck, stats);
    expect(result.overall).toBe(4);
  });
});
