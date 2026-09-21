import type { PlaytestSession } from "./analytics";

/** Evidence produced by comparing playtests before and after a deck change. */
export interface SessionGroupComparison {
  readonly beforeSessions: number;
  readonly afterSessions: number;
  /** Percentage-point change, where a positive value means more wins. */
  readonly winRateDelta: number;
  /** Turn improvement, where a positive value means wins happened earlier. */
  readonly winSpeedDelta: number;
  /** Mulligan change, where a negative value means fewer mulligans. */
  readonly averageMulligansDelta: number;
  readonly hasComparableData: boolean;
}

interface SessionGroupMetrics {
  readonly sessions: number;
  readonly winRate: number;
  readonly averageWinTurns: number | null;
  readonly averageMulligans: number;
}

function summarizeGroup(sessions: readonly PlaytestSession[]): SessionGroupMetrics {
  let wins = 0;
  let winningTurns = 0;
  let mulligans = 0;

  for (const session of sessions) {
    mulligans += session.mulliganCount;
    if (session.result !== "win") continue;
    wins += 1;
    winningTurns += session.turns;
  }

  return {
    sessions: sessions.length,
    winRate: sessions.length === 0 ? 0 : (wins / sessions.length) * 100,
    averageWinTurns: wins === 0 ? null : winningTurns / wins,
    averageMulligans: sessions.length === 0 ? 0 : mulligans / sessions.length,
  };
}

/**
 * Compare two independent cohorts of recorded playtest sessions.
 *
 * @param before - sessions recorded before a proposed deck change
 * @param after - sessions recorded after a proposed deck change
 * @returns directional deltas and whether both cohorts contain evidence
 */
export function compareSessionGroups(
  before: readonly PlaytestSession[],
  after: readonly PlaytestSession[]
): SessionGroupComparison {
  const beforeMetrics = summarizeGroup(before);
  const afterMetrics = summarizeGroup(after);
  const hasComparableData = beforeMetrics.sessions > 0 && afterMetrics.sessions > 0;

  if (!hasComparableData) {
    return {
      beforeSessions: beforeMetrics.sessions,
      afterSessions: afterMetrics.sessions,
      winRateDelta: 0,
      winSpeedDelta: 0,
      averageMulligansDelta: 0,
      hasComparableData: false,
    };
  }

  const hasWinSpeedEvidence =
    beforeMetrics.averageWinTurns !== null && afterMetrics.averageWinTurns !== null;

  return {
    beforeSessions: beforeMetrics.sessions,
    afterSessions: afterMetrics.sessions,
    winRateDelta: afterMetrics.winRate - beforeMetrics.winRate,
    winSpeedDelta: hasWinSpeedEvidence
      ? beforeMetrics.averageWinTurns - afterMetrics.averageWinTurns
      : 0,
    averageMulligansDelta:
      afterMetrics.averageMulligans - beforeMetrics.averageMulligans,
    hasComparableData: true,
  };
}
