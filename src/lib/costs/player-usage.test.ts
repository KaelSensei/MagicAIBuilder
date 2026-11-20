import { describe, expect, it } from "vitest";
import { ASSUMED_USAGE, monthlyUsagePerPlayer } from "./player-usage";

/** Rounds to the precision the spec prints a figure with. */
const toPlaces = (value: number, places: number): number =>
  Number(value.toFixed(places));

describe("monthlyUsagePerPlayer", () => {
  it("reproduces I-66 3.3: one active player's month under the assumed U-values", () => {
    const usage = monthlyUsagePerPlayer(ASSUMED_USAGE);

    expect({
      invocations: usage["function-invocations"],
      activeCpuSeconds: toPlaces(usage["active-cpu-hours"] * 3_600, 1),
      memoryGbHours: toPlaces(usage["provisioned-memory-gb-hours"], 3),
      originTransferMb: toPlaces(usage["fast-origin-transfer-gb"] * 1_000, 1),
      dataTransferMb: toPlaces(usage["fast-data-transfer-gb"] * 1_000, 1),
      cdnRequests: usage["cdn-requests"],
      speedInsightsEvents: usage["speed-insights-events"],
    }).toEqual({
      invocations: 345,
      activeCpuSeconds: 8.6,
      memoryGbHours: 0.048,
      originTransferMb: 7.6,
      dataTransferMb: 11.6,
      cdnRequests: 545,
      speedInsightsEvents: 40,
    });
  });

  it("reproduces the per-player column of I-66 4.1 for replays, database bytes and egress", () => {
    const usage = monthlyUsagePerPlayer(ASSUMED_USAGE);

    expect({
      replays: toPlaces(usage["session-replays"], 2),
      databaseMbPerStoredAccount: usage["database-size-mb"],
      databaseEgressMb: toPlaces(usage["database-egress-gb"] * 1_000, 1),
    }).toEqual({
      replays: 0.08,
      databaseMbPerStoredAccount: 0.36,
      databaseEgressMb: 1.7,
    });
  });

  it("counts a print export's images as function calls whose bytes cross the origin", () => {
    const noExports = monthlyUsagePerPlayer({
      ...ASSUMED_USAGE,
      printExportsPerPlayer: 0,
    });
    const oneExport = monthlyUsagePerPlayer({
      ...ASSUMED_USAGE,
      printExportsPerPlayer: 1,
    });

    expect(
      oneExport["function-invocations"] - noExports["function-invocations"]
    ).toBe(100);
    expect(
      toPlaces(
        (oneExport["fast-origin-transfer-gb"] -
          noExports["fast-origin-transfer-gb"]) *
          1_000,
        2
      )
    ).toBe(11.06);
  });

  it("refuses a negative assumption, which no measurement can produce", () => {
    expect(() =>
      monthlyUsagePerPlayer({ ...ASSUMED_USAGE, sessionsPerPlayer: -1 })
    ).toThrow(RangeError);
  });
});
