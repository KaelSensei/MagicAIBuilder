/**
 * Format-specific deck statistics.
 *
 * Commander decks are graded by bracket scoring; the other formats had no
 * equivalent read on whether a list is well-proportioned. These three measures
 * answer that: is the curve where the format wants it, does the deck present
 * enough pressure, and can it answer the opponent.
 *
 * The benchmarks in `FORMAT_CONFIG` are heuristic starting points, not derived
 * from tournament data. Treat a "below"/"above" verdict as a prompt to look,
 * not a verdict on the deck.
 *
 * @module format-stats
 */

import { getFormatConfig } from "./formats";
import type { CardCategory, DeckCard } from "./types";

/** Where a measured value sits relative to its target band. */
export type BenchmarkStatus = "below" | "on-target" | "above";

/** Categories that pressure the opponent. */
const THREAT_CATEGORIES: ReadonlySet<CardCategory> = new Set([
  "creature",
  "planeswalker",
  "winCondition",
]);

/** Categories that answer the opponent. */
const INTERACTION_CATEGORIES: ReadonlySet<CardCategory> = new Set([
  "removal",
  "boardWipe",
  "protection",
]);

/** Format-specific measures for a single deck. */
export interface FormatStats {
  /** Cards that pressure the opponent, counting quantities */
  readonly threats: number;
  /** `threats` as a share of non-land cards (0–1) */
  readonly threatDensity: number;
  /** Cards that answer the opponent, counting quantities */
  readonly interaction: number;
  /** `interaction` as a share of non-land cards (0–1) */
  readonly interactionRatio: number;
  readonly curveStatus: BenchmarkStatus;
  readonly threatStatus: BenchmarkStatus;
  readonly interactionStatus: BenchmarkStatus;
  /** The format's own bands, so the UI does not have to look them up */
  readonly avgCmcTarget: readonly [number, number];
  readonly threatDensityTarget: readonly [number, number];
  readonly interactionRatioTarget: readonly [number, number];
}

/**
 * Places a value against a target band.
 *
 * @param value - measured value
 * @param target - inclusive `[min, max]` band
 * @returns whether the value is below, inside, or above the band
 */
export function benchmarkStatus(
  value: number,
  target: readonly [number, number]
): BenchmarkStatus {
  const [min, max] = target;
  if (value < min) return "below";
  if (value > max) return "above";
  return "on-target";
}

/**
 * Sums quantities of the cards whose category is in `categories`.
 *
 * @param cards - cards to scan
 * @param categories - categories to count
 * @returns total quantity across matching cards
 */
function countByCategory(
  cards: readonly DeckCard[],
  categories: ReadonlySet<CardCategory>
): number {
  let total = 0;
  for (const card of cards) {
    if (categories.has(card.category)) total += card.quantity;
  }
  return total;
}

/**
 * Computes the format-specific measures for a deck.
 *
 * Ratios are taken against non-land cards rather than the whole deck: a
 * 60-card list with 24 lands and a 100-card list with 38 are not comparable on
 * raw counts, but their spell mix is.
 *
 * @param format - the deck's format
 * @param cards - every card in the deck, lands included
 * @param avgCmc - average mana value excluding lands, as computed by `computeDeckStats`
 * @returns the measures, or `null` when the format does not use them
 */
export function buildFormatStats(
  format: string,
  cards: readonly DeckCard[],
  avgCmc: number
): FormatStats | null {
  const config = getFormatConfig(format);
  if (!config.hasFormatStats) return null;

  const nonLandCards = cards.filter((card) => card.category !== "land");
  const nonLandCount = nonLandCards.reduce((sum, card) => sum + card.quantity, 0);

  const threats = countByCategory(nonLandCards, THREAT_CATEGORIES);
  const interaction = countByCategory(nonLandCards, INTERACTION_CATEGORIES);

  // An all-land deck is degenerate but reachable mid-build; report zero rather
  // than NaN, which would render as "NaN%".
  const threatDensity = nonLandCount === 0 ? 0 : threats / nonLandCount;
  const interactionRatio = nonLandCount === 0 ? 0 : interaction / nonLandCount;

  return {
    threats,
    threatDensity,
    interaction,
    interactionRatio,
    curveStatus: benchmarkStatus(avgCmc, config.avgCmcTarget),
    threatStatus: benchmarkStatus(threatDensity, config.threatDensityTarget),
    interactionStatus: benchmarkStatus(interactionRatio, config.interactionRatioTarget),
    avgCmcTarget: config.avgCmcTarget,
    threatDensityTarget: config.threatDensityTarget,
    interactionRatioTarget: config.interactionRatioTarget,
  };
}
