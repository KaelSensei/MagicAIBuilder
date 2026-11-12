import { describe, expect, it } from "vitest";
import type { DeckStats } from "@/lib/deck/analysis-types";
import { compareDeckAnalysis } from "./analysis-change-diff";

const before: DeckStats = {
  totalCards: 100,
  lands: 35,
  creatures: 24,
  ramp: 9,
  draw: 8,
  removal: 7,
  boardWipes: 2,
  avgCmc: 3.42,
  manaCurve: {},
  colorDistribution: {},
  gameChangersCount: 1,
  gameChangersList: [],
  totalPrice: 200,
  overBudgetCards: [],
  bannedCards: ["Banned card"],
  colorIdentityViolations: ["Off-color card"],
  commanderRuleIssues: [],
  flexibleLands: 4,
  formatStats: null,
  manaAlignment: null,
  turnOnePlayability: null,
};

describe("compareDeckAnalysis", () => {
  it("reports before, after, and signed deltas from existing deck statistics", () => {
    const after: DeckStats = {
      ...before,
      lands: 36,
      ramp: 11,
      avgCmc: 3.1,
      totalPrice: 214.5,
      bannedCards: [],
      colorIdentityViolations: [],
    };

    expect(compareDeckAnalysis(before, after)).toEqual({
      metrics: [
        { key: "lands", before: 35, after: 36, delta: 1 },
        { key: "ramp", before: 9, after: 11, delta: 2 },
        { key: "draw", before: 8, after: 8, delta: 0 },
        { key: "removal", before: 7, after: 7, delta: 0 },
        { key: "avgCmc", before: 3.42, after: 3.1, delta: -0.32 },
        { key: "totalPrice", before: 200, after: 214.5, delta: 14.5 },
      ],
      legalities: {
        bannedCards: {
          key: "bannedCards",
          before: 1,
          after: 0,
          delta: -1,
        },
        colorIdentityViolations: {
          key: "colorIdentityViolations",
          before: 1,
          after: 0,
          delta: -1,
        },
      },
    });
  });
});
