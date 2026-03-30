/**
 * Playtest Analytics — TDD RED phase
 * US-AG: Pure logic for win rates, mulligan stats, matchup stats, and trend data.
 */

import { describe, expect, it } from "vitest";
import {
  buildTrendData,
  calculateAverageTurns,
  calculateWinRate,
  getMatchupStats,
  getMulliganDistribution,
} from "./analytics";
import type { PlaytestSession } from "./analytics";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeSession = (
  overrides: Partial<PlaytestSession> & Pick<PlaytestSession, "result">,
): PlaytestSession => ({
  id: "s1",
  deckId: "deck1",
  userId: "user1",
  turns: 7,
  mulliganCount: 0,
  createdAt: new Date("2025-01-15"),
  ...overrides,
});

const sessions: readonly PlaytestSession[] = [
  makeSession({ id: "1", result: "win", turns: 6, mulliganCount: 0, createdAt: new Date("2025-01-10") }),
  makeSession({ id: "2", result: "win", turns: 8, mulliganCount: 1, createdAt: new Date("2025-01-15") }),
  makeSession({ id: "3", result: "loss", turns: 10, mulliganCount: 0, createdAt: new Date("2025-01-15") }),
  makeSession({ id: "4", result: "loss", turns: 12, mulliganCount: 2, createdAt: new Date("2025-02-01") }),
  makeSession({ id: "5", result: "draw", turns: 15, mulliganCount: 1, createdAt: new Date("2025-02-10") }),
];

// ─── calculateWinRate ────────────────────────────────────────────────────────

describe("calculateWinRate", () => {
  it("returns 0 for empty sessions", () => {
    expect(calculateWinRate([])).toBe(0);
  });

  it("returns 100 when all sessions are wins", () => {
    const wins: readonly PlaytestSession[] = [
      makeSession({ id: "1", result: "win" }),
      makeSession({ id: "2", result: "win" }),
    ];
    expect(calculateWinRate(wins)).toBe(100);
  });

  it("returns 0 when all sessions are losses", () => {
    const losses: readonly PlaytestSession[] = [
      makeSession({ id: "1", result: "loss" }),
      makeSession({ id: "2", result: "loss" }),
    ];
    expect(calculateWinRate(losses)).toBe(0);
  });

  it("calculates correct win rate with mixed results", () => {
    // 2 wins out of 5 sessions = 40%
    expect(calculateWinRate(sessions)).toBe(40);
  });

  it("excludes draws from win rate calculation", () => {
    const withDraw: readonly PlaytestSession[] = [
      makeSession({ id: "1", result: "win" }),
      makeSession({ id: "2", result: "loss" }),
      makeSession({ id: "3", result: "draw" }),
    ];
    // 1 win, 1 loss, 1 draw → win rate over all sessions = 33.33...
    expect(calculateWinRate(withDraw)).toBeCloseTo(33.33, 1);
  });
});

// ─── calculateAverageTurns ────────────────────────────────────────────────────

describe("calculateAverageTurns", () => {
  it("returns 0 for empty sessions", () => {
    expect(calculateAverageTurns([], "win")).toBe(0);
  });

  it("returns 0 when no sessions match the result filter", () => {
    const losses: readonly PlaytestSession[] = [
      makeSession({ id: "1", result: "loss", turns: 10 }),
    ];
    expect(calculateAverageTurns(losses, "win")).toBe(0);
  });

  it("calculates average turns for wins", () => {
    // wins: turns 6 and 8 → avg = 7
    expect(calculateAverageTurns(sessions, "win")).toBe(7);
  });

  it("calculates average turns for losses", () => {
    // losses: turns 10 and 12 → avg = 11
    expect(calculateAverageTurns(sessions, "loss")).toBe(11);
  });

  it("calculates average turns for draws", () => {
    // draws: turns 15 → avg = 15
    expect(calculateAverageTurns(sessions, "draw")).toBe(15);
  });
});

// ─── getMulliganDistribution ──────────────────────────────────────────────────

describe("getMulliganDistribution", () => {
  it("returns empty object for empty sessions", () => {
    expect(getMulliganDistribution([])).toEqual({});
  });

  it("counts sessions per mulligan count", () => {
    const dist = getMulliganDistribution(sessions);
    // mulliganCount=0: sessions 1,3 → count=2, wins=1 → winRate=50
    // mulliganCount=1: sessions 2,5 → count=2, wins=1 → winRate=50
    // mulliganCount=2: session 4    → count=1, wins=0 → winRate=0
    expect(dist[0]?.count).toBe(2);
    expect(dist[1]?.count).toBe(2);
    expect(dist[2]?.count).toBe(1);
  });

  it("calculates win rate per mulligan bucket", () => {
    const dist = getMulliganDistribution(sessions);
    // mulliganCount=0: 1 win out of 2 → 50%
    expect(dist[0]?.winRate).toBe(50);
    // mulliganCount=1: 1 win out of 2 → 50%
    expect(dist[1]?.winRate).toBe(50);
    // mulliganCount=2: 0 wins out of 1 → 0%
    expect(dist[2]?.winRate).toBe(0);
  });
});

// ─── getMatchupStats ──────────────────────────────────────────────────────────

describe("getMatchupStats", () => {
  it("returns empty object for sessions without difficulty", () => {
    const result = getMatchupStats(sessions);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("groups stats by difficulty", () => {
    const matchupSessions: readonly PlaytestSession[] = [
      makeSession({ id: "1", result: "win", difficulty: "budget" }),
      makeSession({ id: "2", result: "win", difficulty: "budget" }),
      makeSession({ id: "3", result: "loss", difficulty: "budget" }),
      makeSession({ id: "4", result: "win", difficulty: "cedh" }),
      makeSession({ id: "5", result: "loss", difficulty: "cedh" }),
      makeSession({ id: "6", result: "loss", difficulty: "cedh" }),
    ];
    const stats = getMatchupStats(matchupSessions);

    expect(stats["budget"]?.wins).toBe(2);
    expect(stats["budget"]?.losses).toBe(1);
    expect(stats["budget"]?.winRate).toBeCloseTo(66.67, 1);

    expect(stats["cedh"]?.wins).toBe(1);
    expect(stats["cedh"]?.losses).toBe(2);
    expect(stats["cedh"]?.winRate).toBeCloseTo(33.33, 1);
  });

  it("ignores draws for win/loss counts but includes in total for winRate", () => {
    const matchupSessions: readonly PlaytestSession[] = [
      makeSession({ id: "1", result: "win", difficulty: "mid-range" }),
      makeSession({ id: "2", result: "draw", difficulty: "mid-range" }),
    ];
    const stats = getMatchupStats(matchupSessions);
    expect(stats["mid-range"]?.wins).toBe(1);
    expect(stats["mid-range"]?.losses).toBe(0);
    expect(stats["mid-range"]?.winRate).toBe(50);
  });
});

// ─── buildTrendData ───────────────────────────────────────────────────────────

describe("buildTrendData", () => {
  it("returns empty array for empty sessions", () => {
    expect(buildTrendData([])).toEqual([]);
  });

  it("groups sessions by date (YYYY-MM-DD)", () => {
    const trend = buildTrendData(sessions);
    // dates: 2025-01-10, 2025-01-15, 2025-02-01, 2025-02-10
    expect(trend).toHaveLength(4);
  });

  it("returns data sorted chronologically", () => {
    const trend = buildTrendData(sessions);
    for (let i = 1; i < trend.length; i++) {
      expect(trend[i]!.date >= trend[i - 1]!.date).toBe(true);
    }
  });

  it("calculates win rate per day", () => {
    const trend = buildTrendData(sessions);
    const jan10 = trend.find((t) => t.date === "2025-01-10");
    const jan15 = trend.find((t) => t.date === "2025-01-15");

    // 2025-01-10: 1 win / 1 total → 100%
    expect(jan10?.winRate).toBe(100);
    expect(jan10?.total).toBe(1);

    // 2025-01-15: 1 win, 1 loss → 50%
    expect(jan15?.winRate).toBe(50);
    expect(jan15?.total).toBe(2);
  });

  it("calculates total sessions per day", () => {
    const trend = buildTrendData(sessions);
    const feb1 = trend.find((t) => t.date === "2025-02-01");
    const feb10 = trend.find((t) => t.date === "2025-02-10");

    expect(feb1?.total).toBe(1);
    expect(feb10?.total).toBe(1);
  });
});
