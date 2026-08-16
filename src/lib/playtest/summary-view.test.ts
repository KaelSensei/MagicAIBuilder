import { describe, it, expect } from "vitest";

import { mulliganRows, trendDirection, MIN_TREND_POINTS } from "./summary-view";
import type { TrendPoint } from "./analytics";

function point(date: string, winRate: number, total = 4): TrendPoint {
  return { date, winRate, total };
}

describe("trendDirection", () => {
  it("says nothing from a single day of play", () => {
    expect(trendDirection([point("2026-08-10", 100)])).toBe("insufficient");
  });

  it("says nothing from fewer days than it takes to compare two halves", () => {
    const points = Array.from({ length: MIN_TREND_POINTS - 1 }, (_, i) =>
      point(`2026-08-0${i + 1}`, 50)
    );
    expect(trendDirection(points)).toBe("insufficient");
  });

  it("says nothing at all about an empty history", () => {
    expect(trendDirection([])).toBe("insufficient");
  });

  it("reports a rising win rate as improving", () => {
    const points = [
      point("2026-08-01", 20),
      point("2026-08-02", 20),
      point("2026-08-03", 80),
      point("2026-08-04", 80),
    ];
    expect(trendDirection(points)).toBe("improving");
  });

  it("reports a falling win rate as declining", () => {
    const points = [
      point("2026-08-01", 90),
      point("2026-08-02", 90),
      point("2026-08-03", 30),
      point("2026-08-04", 30),
    ];
    expect(trendDirection(points)).toBe("declining");
  });

  it("calls a small wobble steady rather than a trend", () => {
    const points = [
      point("2026-08-01", 50),
      point("2026-08-02", 50),
      point("2026-08-03", 54),
      point("2026-08-04", 54),
    ];
    expect(trendDirection(points)).toBe("steady");
  });

  it("weights a day by how many games were played on it", () => {
    // One lucky game at 100% must not outweigh twenty games at 40%.
    const points = [
      point("2026-08-01", 40, 20),
      point("2026-08-02", 40, 20),
      point("2026-08-03", 100, 1),
      point("2026-08-04", 40, 20),
    ];
    expect(trendDirection(points)).toBe("steady");
  });

  it("compares the older half against the newer, not first against last", () => {
    // A dip in the middle should not read as a decline overall.
    const points = [
      point("2026-08-01", 60),
      point("2026-08-02", 10),
      point("2026-08-03", 10),
      point("2026-08-04", 60),
    ];
    expect(trendDirection(points)).toBe("steady");
  });

  it("puts the odd middle day in neither half when the count is odd", () => {
    const points = [
      point("2026-08-01", 0),
      point("2026-08-02", 0),
      point("2026-08-03", 50),
      point("2026-08-04", 100),
      point("2026-08-05", 100),
    ];
    expect(trendDirection(points)).toBe("improving");
  });
});

describe("mulliganRows", () => {
  it("returns nothing for a deck never played", () => {
    expect(mulliganRows({})).toEqual([]);
  });

  it("orders rows by mulligan count, lowest first", () => {
    const rows = mulliganRows({
      2: { count: 1, winRate: 0 },
      0: { count: 5, winRate: 60 },
      1: { count: 3, winRate: 33 },
    });
    expect(rows.map((r) => r.mulligans)).toEqual([0, 1, 2]);
  });

  it("carries the count and win rate of each bucket", () => {
    const rows = mulliganRows({ 0: { count: 5, winRate: 60 } });
    expect(rows[0]).toEqual({ mulligans: 0, count: 5, winRate: 60 });
  });

  it("keeps a bucket that exists but was never won", () => {
    const rows = mulliganRows({ 3: { count: 2, winRate: 0 } });
    expect(rows).toHaveLength(1);
    expect(rows[0].winRate).toBe(0);
  });
});
