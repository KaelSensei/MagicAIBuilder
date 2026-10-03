import { describe, expect, it } from "vitest";

import type { PlaytestSession } from "./analytics";
import { compareSessionGroups } from "./comparison";

function session(
  id: string,
  result: PlaytestSession["result"],
  turns: number,
  mulliganCount: number
): PlaytestSession {
  return {
    id,
    deckId: "deck-1",
    userId: "user-1",
    result,
    turns,
    mulliganCount,
    createdAt: new Date("2026-09-01T12:00:00.000Z"),
  };
}

describe("compareSessionGroups", () => {
  it("compares win rate, win speed, and average mulligans", () => {
    const before = [
      session("before-1", "win", 8, 1),
      session("before-2", "loss", 10, 1),
    ];
    const after = [
      session("after-1", "win", 6, 0),
      session("after-2", "win", 8, 1),
    ];

    expect(compareSessionGroups(before, after)).toEqual({
      beforeSessions: 2,
      afterSessions: 2,
      winRateDelta: 50,
      winSpeedDelta: 1,
      averageMulligansDelta: -0.5,
      hasComparableData: true,
    });
  });

  it("does not claim a comparison when either group is empty", () => {
    expect(compareSessionGroups([], [session("after", "win", 6, 0)])).toEqual({
      beforeSessions: 0,
      afterSessions: 1,
      winRateDelta: 0,
      winSpeedDelta: 0,
      averageMulligansDelta: 0,
      hasComparableData: false,
    });
  });

  it("does not invent a win-speed change when a group has no wins", () => {
    const comparison = compareSessionGroups(
      [session("before", "loss", 10, 0)],
      [session("after", "win", 6, 0)]
    );

    expect(comparison.winSpeedDelta).toBe(0);
  });
});
