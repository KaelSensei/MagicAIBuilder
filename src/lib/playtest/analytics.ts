/**
 * Playtest Analytics — Pure functions for session statistics.
 * US-AG Phase 1: Zero framework dependencies, zero side effects.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlaytestSession {
  readonly id: string;
  readonly deckId: string;
  readonly userId: string;
  readonly result: "win" | "loss" | "draw";
  readonly turns: number;
  readonly mulliganCount: number;
  readonly difficulty?: "budget" | "mid-range" | "cedh";
  readonly notes?: string;
  readonly createdAt: Date;
}

export interface MulliganBucket {
  readonly count: number;
  readonly winRate: number;
}

export interface MatchupStat {
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
}

export interface TrendPoint {
  readonly date: string;
  readonly winRate: number;
  readonly total: number;
}

// ─── calculateWinRate ─────────────────────────────────────────────────────────

/**
 * Returns the percentage of sessions that are wins (0–100).
 * Draws count toward the total, reducing the win rate.
 */
export function calculateWinRate(sessions: readonly PlaytestSession[]): number {
  if (sessions.length === 0) return 0;
  const wins = sessions.filter((s) => s.result === "win").length;
  return (wins / sessions.length) * 100;
}

// ─── calculateAverageTurns ────────────────────────────────────────────────────

/**
 * Returns the average number of turns for sessions matching the given result.
 * Returns 0 if no sessions match.
 */
export function calculateAverageTurns(
  sessions: readonly PlaytestSession[],
  result: PlaytestSession["result"],
): number {
  const filtered = sessions.filter((s) => s.result === result);
  if (filtered.length === 0) return 0;
  const total = filtered.reduce((sum, s) => sum + s.turns, 0);
  return total / filtered.length;
}

// ─── getMulliganDistribution ──────────────────────────────────────────────────

/**
 * Returns a map of mulliganCount → { count, winRate }.
 * winRate is the percentage of wins within that mulligan bucket.
 */
export function getMulliganDistribution(
  sessions: readonly PlaytestSession[],
): Record<number, MulliganBucket> {
  const buckets: Record<number, { wins: number; total: number }> = {};

  for (const session of sessions) {
    const bucket = buckets[session.mulliganCount] ?? { wins: 0, total: 0 };
    buckets[session.mulliganCount] = {
      wins: bucket.wins + (session.result === "win" ? 1 : 0),
      total: bucket.total + 1,
    };
  }

  const result: Record<number, MulliganBucket> = {};
  for (const [key, { wins, total }] of Object.entries(buckets)) {
    result[Number(key)] = {
      count: total,
      winRate: (wins / total) * 100,
    };
  }
  return result;
}

// ─── getMatchupStats ──────────────────────────────────────────────────────────

/**
 * Returns stats grouped by difficulty level.
 * Sessions without a difficulty value are excluded.
 * winRate is wins / total (including draws).
 */
export function getMatchupStats(
  sessions: readonly PlaytestSession[],
): Record<string, MatchupStat> {
  const groups: Record<string, { wins: number; losses: number; total: number }> = {};

  for (const session of sessions) {
    if (session.difficulty === undefined) continue;
    const group = groups[session.difficulty] ?? { wins: 0, losses: 0, total: 0 };
    groups[session.difficulty] = {
      wins: group.wins + (session.result === "win" ? 1 : 0),
      losses: group.losses + (session.result === "loss" ? 1 : 0),
      total: group.total + 1,
    };
  }

  const result: Record<string, MatchupStat> = {};
  for (const [key, { wins, losses, total }] of Object.entries(groups)) {
    result[key] = {
      wins,
      losses,
      winRate: (wins / total) * 100,
    };
  }
  return result;
}

// ─── buildTrendData ───────────────────────────────────────────────────────────

/**
 * Returns an array of daily trend points sorted chronologically.
 * Each point contains: date (YYYY-MM-DD), winRate, total sessions.
 */
export function buildTrendData(sessions: readonly PlaytestSession[]): TrendPoint[] {
  const days: Record<string, { wins: number; total: number }> = {};

  for (const session of sessions) {
    const date = session.createdAt.toISOString().slice(0, 10);
    const day = days[date] ?? { wins: 0, total: 0 };
    days[date] = {
      wins: day.wins + (session.result === "win" ? 1 : 0),
      total: day.total + 1,
    };
  }

  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { wins, total }]) => ({
      date,
      winRate: (wins / total) * 100,
      total,
    }));
}
