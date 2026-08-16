/**
 * Presentation logic for recorded playtest history.
 *
 * `analytics.ts` produces the raw figures and `session-input.ts` rolls them up.
 * This module answers the one question the panel asks that neither of those
 * does: **is the deck getting better?**
 *
 * @module playtest/summary-view
 */

import type { MatchupStat, MulliganBucket, TrendPoint } from "./analytics";
import { SESSION_DIFFICULTIES } from "./session-input";

/** Which way the win rate is moving, or that there is not enough play to say. */
export type TrendDirection = "improving" | "steady" | "declining" | "insufficient";

/**
 * Days of play needed before a direction is claimed.
 *
 * Four splits into two halves of two. Fewer would mean calling a trend off a
 * single day on each side, where one lucky game decides the verdict.
 */
export const MIN_TREND_POINTS = 4;

/**
 * Percentage points a win rate must move before it counts as a trend.
 *
 * Win rates over a handful of games are noisy; below this the honest answer is
 * "steady", not a direction the player might act on.
 */
const TREND_THRESHOLD = 10;

/** One row of the mulligan breakdown. */
export interface MulliganRow {
  readonly mulligans: number;
  readonly count: number;
  readonly winRate: number;
}

/**
 * Win rate across a run of days, weighted by how many games each day held.
 *
 * Weighting matters: a single lucky game at 100% must not count for as much as
 * twenty games at 40%, which is exactly what a plain mean of the daily rates
 * would do.
 *
 * @param points - the days to average
 * @returns the weighted win rate, or 0 when no games were played
 */
function weightedWinRate(points: readonly TrendPoint[]): number {
  let games = 0;
  let wins = 0;

  for (const point of points) {
    games += point.total;
    // TrendPoint carries a rate, not a win count; recover the latter.
    wins += (point.winRate / 100) * point.total;
  }

  return games === 0 ? 0 : (wins / games) * 100;
}

/**
 * Works out whether the deck's win rate is moving.
 *
 * The history is split in half chronologically and the two halves compared,
 * rather than first point against last: a single bad day in the middle should
 * not read as a decline. With an odd number of days the middle one is left out
 * of both halves, so it cannot pull the comparison either way.
 *
 * @param trend - daily points, oldest first, as returned by `buildTrendData`
 * @returns the direction, or `"insufficient"` when there is too little play
 */
export function trendDirection(trend: readonly TrendPoint[]): TrendDirection {
  if (trend.length < MIN_TREND_POINTS) return "insufficient";

  const half = Math.floor(trend.length / 2);
  const older = weightedWinRate(trend.slice(0, half));
  const newer = weightedWinRate(trend.slice(trend.length - half));

  const change = newer - older;
  if (change > TREND_THRESHOLD) return "improving";
  if (change < -TREND_THRESHOLD) return "declining";
  return "steady";
}

/**
 * Orders the mulligan breakdown for display.
 *
 * @param mulligans - buckets keyed by mulligan count
 * @returns one row per bucket, fewest mulligans first
 */
export function mulliganRows(
  mulligans: Record<number, MulliganBucket>
): readonly MulliganRow[] {
  return Object.entries(mulligans)
    .map(([key, bucket]) => ({
      mulligans: Number(key),
      count: bucket.count,
      winRate: bucket.winRate,
    }))
    .sort((a, b) => a.mulligans - b.mulligans);
}

/** One row of the matchup breakdown. */
export interface MatchupRow {
  readonly difficulty: string;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
}

/**
 * Orders the matchup breakdown for display.
 *
 * Sorted by **opponent strength**, not alphabetically: alphabetical would read
 * budget, cedh, mid-range, putting the strongest opponent in the middle and
 * making the table hard to read down.
 *
 * A difficulty this list does not know is kept and sorted after the known ones,
 * rather than dropped. Silently discarding recorded games would be worse than
 * showing an unfamiliar label.
 *
 * @param matchups - stats keyed by difficulty
 * @returns one row per difficulty played, weakest opponent first
 */
export function matchupRows(matchups: Record<string, MatchupStat>): readonly MatchupRow[] {
  const rank = (difficulty: string): number => {
    const index = SESSION_DIFFICULTIES.indexOf(difficulty as never);
    return index === -1 ? SESSION_DIFFICULTIES.length : index;
  };

  return Object.entries(matchups)
    .map(([difficulty, stat]) => ({
      difficulty,
      wins: stat.wins,
      losses: stat.losses,
      winRate: stat.winRate,
    }))
    .sort((a, b) => {
      const byRank = rank(a.difficulty) - rank(b.difficulty);
      // Unknown values all share a rank; order those by name so the table is
      // at least stable between renders.
      return byRank !== 0 ? byRank : a.difficulty.localeCompare(b.difficulty);
    });
}
