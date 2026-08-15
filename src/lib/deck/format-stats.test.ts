import { describe, it, expect } from "vitest";
import { buildFormatStats, benchmarkStatus } from "./format-stats";
import type { DeckCard } from "./types";
import type { CardCategory } from "./types";

function card(category: CardCategory, cmc = 2, quantity = 1): DeckCard {
  return {
    id: `${category}-${cmc}-${Math.random()}`,
    scryfallId: "00000000-0000-4000-8000-000000000000",
    name: `${category} ${cmc}`,
    manaCost: "",
    cmc,
    typeLine: "",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category,
    quantity,
    zone: "main",
  };
}

/** Builds a card list with the given counts per category. */
function deckOf(counts: Partial<Record<CardCategory, number>>, cmc = 2): readonly DeckCard[] {
  return Object.entries(counts).flatMap(([category, n]) =>
    Array.from({ length: n as number }, () => card(category as CardCategory, cmc))
  );
}

describe("benchmarkStatus", () => {
  it("reports a value inside the band as on target", () => {
    expect(benchmarkStatus(0.4, [0.3, 0.5])).toBe("on-target");
  });

  it("treats the bounds themselves as on target", () => {
    expect(benchmarkStatus(0.3, [0.3, 0.5])).toBe("on-target");
    expect(benchmarkStatus(0.5, [0.3, 0.5])).toBe("on-target");
  });

  it("reports values outside the band", () => {
    expect(benchmarkStatus(0.2, [0.3, 0.5])).toBe("below");
    expect(benchmarkStatus(0.9, [0.3, 0.5])).toBe("above");
  });
});

describe("buildFormatStats", () => {
  it("returns null for formats without format statistics", () => {
    // Commander is covered by bracket scoring instead.
    expect(buildFormatStats("commander", deckOf({ creature: 30 }), 3)).toBeNull();
  });

  it("counts creatures, planeswalkers and win conditions as threats", () => {
    const cards = deckOf({ creature: 10, planeswalker: 2, winCondition: 2, land: 24 });

    const stats = buildFormatStats("modern", cards, 2.5);

    expect(stats?.threats).toBe(14);
  });

  it("counts removal, board wipes and protection as interaction", () => {
    const cards = deckOf({ removal: 6, boardWipe: 2, protection: 2, creature: 10, land: 24 });

    const stats = buildFormatStats("modern", cards, 2.5);

    expect(stats?.interaction).toBe(10);
  });

  it("measures density against non-land cards, not the whole deck", () => {
    // 12 threats out of 24 non-lands is 50%, not 12/60.
    const cards = deckOf({ creature: 12, removal: 12, land: 36 });

    const stats = buildFormatStats("modern", cards, 2);

    expect(stats?.threatDensity).toBeCloseTo(0.5, 5);
    expect(stats?.interactionRatio).toBeCloseTo(0.5, 5);
  });

  it("respects card quantities", () => {
    const cards = [card("creature", 2, 4), card("land", 0, 20)];

    const stats = buildFormatStats("modern", cards, 2);

    expect(stats?.threats).toBe(4);
  });

  it("does not divide by zero for a deck of nothing but lands", () => {
    const stats = buildFormatStats("modern", deckOf({ land: 24 }), 0);

    expect(stats?.threatDensity).toBe(0);
    expect(stats?.interactionRatio).toBe(0);
  });

  it("flags a curve above the format target", () => {
    const stats = buildFormatStats("modern", deckOf({ creature: 20 }), 6);

    expect(stats?.curveStatus).toBe("above");
  });

  it("flags a threat-light deck as below target", () => {
    const cards = deckOf({ creature: 1, removal: 19, land: 24 });

    const stats = buildFormatStats("modern", cards, 2.5);

    expect(stats?.threatStatus).toBe("below");
  });

  it("flags an interaction-free deck as below target", () => {
    const cards = deckOf({ creature: 36, land: 24 });

    const stats = buildFormatStats("modern", cards, 2.5);

    expect(stats?.interactionRatio).toBe(0);
    expect(stats?.interactionStatus).toBe("below");
  });

  it("carries the format's own targets so the UI need not look them up", () => {
    const stats = buildFormatStats("legacy", deckOf({ creature: 20, land: 20 }), 2);

    expect(stats?.avgCmcTarget).toHaveLength(2);
    expect(stats?.avgCmcTarget[0]).toBeLessThan(stats?.avgCmcTarget[1] ?? 0);
  });

  it("expects a lower curve in Legacy than in Standard", () => {
    const legacy = buildFormatStats("legacy", deckOf({ creature: 20 }), 2);
    const standard = buildFormatStats("standard", deckOf({ creature: 20 }), 2);

    expect(legacy?.avgCmcTarget[1]).toBeLessThan(standard?.avgCmcTarget[1] ?? 0);
  });
});
