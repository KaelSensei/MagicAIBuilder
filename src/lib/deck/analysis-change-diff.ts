import type { DeckStats } from "./types";

export type AnalysisMetricKey =
  | "lands"
  | "ramp"
  | "draw"
  | "removal"
  | "avgCmc"
  | "totalPrice";

export type AnalysisLegalityKey =
  | "bannedCards"
  | "colorIdentityViolations";

export interface AnalysisMetricDiff {
  readonly key: AnalysisMetricKey | AnalysisLegalityKey;
  readonly before: number;
  readonly after: number;
  readonly delta: number;
}

export interface AnalysisChangeDiff {
  readonly metrics: readonly AnalysisMetricDiff[];
  readonly legalities: {
    readonly bannedCards: AnalysisMetricDiff;
    readonly colorIdentityViolations: AnalysisMetricDiff;
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function createDiff(
  key: AnalysisMetricKey | AnalysisLegalityKey,
  before: number,
  after: number
): AnalysisMetricDiff {
  return { key, before, after, delta: round(after - before) };
}

/**
 * Compares two deterministic deck analyses, for example before and after a
 * manually proposed deck change. This function has no knowledge of the
 * change's origin and does not modify either analysis.
 */
export function compareDeckAnalysis(
  before: DeckStats,
  after: DeckStats
): AnalysisChangeDiff {
  return {
    metrics: [
      createDiff("lands", before.lands, after.lands),
      createDiff("ramp", before.ramp, after.ramp),
      createDiff("draw", before.draw, after.draw),
      createDiff("removal", before.removal, after.removal),
      createDiff("avgCmc", before.avgCmc, after.avgCmc),
      createDiff("totalPrice", before.totalPrice, after.totalPrice),
    ],
    legalities: {
      bannedCards: createDiff(
        "bannedCards",
        before.bannedCards.length,
        after.bannedCards.length
      ),
      colorIdentityViolations: createDiff(
        "colorIdentityViolations",
        before.colorIdentityViolations.length,
        after.colorIdentityViolations.length
      ),
    },
  };
}
