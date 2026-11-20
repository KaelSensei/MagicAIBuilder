import { describe, expect, it } from "vitest";
import {
  costPerActivePlayer,
  limitHeadroom,
  playersCoveredBy,
} from "./cost-model";
import { ASSUMED_USAGE, monthlyUsagePerPlayer } from "./player-usage";
import { PRICE_BOOK } from "./price-book";

const USAGE = monthlyUsagePerPlayer(ASSUMED_USAGE);
const PRO_DUBLIN = PRICE_BOOK.filter(
  (p) => p.plan === "pro" && p.region === "dub1"
);
const FREE_ALLOTMENTS = PRICE_BOOK.filter((p) => p.rateUsd === null);
const RESERVED_FOR_CACHES_MB = 100;

/** Rounds to the nearest multiple of `step`, as the spec's "about" figures do. */
const toNearest = (value: number, step: number): number =>
  Math.round(value / step) * step;

describe("costPerActivePlayer", () => {
  it("reproduces I-66 3.3: $0.0017 for functions and origin transfer, $0.0048 with transfer and requests billed", () => {
    const cost = costPerActivePlayer(USAGE, PRO_DUBLIN);

    expect(cost.usageBasedUsd.toFixed(4)).toBe("0.0017");
    expect(cost.allResourcesUsd.toFixed(4)).toBe("0.0048");
  });

  it("prices 1,000 active players at $1.7 to $4.8 a month", () => {
    const cost = costPerActivePlayer(USAGE, PRO_DUBLIN);

    expect((cost.usageBasedUsd * 1_000).toFixed(1)).toBe("1.7");
    expect((cost.allResourcesUsd * 1_000).toFixed(1)).toBe("4.8");
  });

  it("refuses two rates for one resource, which would bill it twice", () => {
    const twice = [...PRO_DUBLIN, { ...PRO_DUBLIN[0], region: "iad1" }];

    expect(() => costPerActivePlayer(USAGE, twice)).toThrow(RangeError);
  });
});

describe("playersCoveredBy", () => {
  it("counts the whole active players Pro's $20 usage credit pays for", () => {
    const cost = costPerActivePlayer(USAGE, PRO_DUBLIN);

    // The spec rounds these to "about 4,200–11,500".
    expect(playersCoveredBy(20, cost.allResourcesUsd)).toBe(4_190);
    expect(playersCoveredBy(20, cost.usageBasedUsd)).toBe(11_564);
  });

  it("refuses a cost of zero or less, which no credit runs out on", () => {
    expect(() => playersCoveredBy(20, 0)).toThrow(RangeError);
  });

  it("refuses a cost that is not a number, as it refuses zero", () => {
    expect(() => playersCoveredBy(20, Number.NaN)).toThrow(RangeError);
  });
});

describe("limitHeadroom", () => {
  it("reproduces I-66 4.1: where each free allotment hits, least headroom first", () => {
    const rows = limitHeadroom(USAGE, FREE_ALLOTMENTS, RESERVED_FOR_CACHES_MB);

    expect(
      rows.map((row) => [
        row.allotment.resource,
        row.scalesWith,
        row.hitsAt === null
          ? null
          : toNearest(row.hitsAt, row.hitsAt < 1_000 ? 1 : 100),
      ])
    ).toEqual([
      ["speed-insights-events", "active players", 250],
      ["session-replays", "active players", 625],
      ["database-size-mb", "stored accounts", 1_100],
      ["fast-origin-transfer-gb", "active players", 1_300],
      ["active-cpu-hours", "active players", 1_700],
      ["cdn-requests", "active players", 1_800],
      ["function-invocations", "active players", 2_900],
      ["database-egress-gb", "active players", 2_900],
      ["provisioned-memory-gb-hours", "active players", 7_500],
      ["fast-data-transfer-gb", "active players", 8_600],
    ]);
  });

  it("hits the database at about 800 stored accounts once I-67's card tables take 100 MB more", () => {
    const database = limitHeadroom(
      USAGE,
      FREE_ALLOTMENTS,
      RESERVED_FOR_CACHES_MB + 100
    ).find((row) => row.allotment.resource === "database-size-mb");

    expect(toNearest(database?.hitsAt ?? 0, 100)).toBe(800);
  });

  it("never hits an allotment a player does not use, and lists it last", () => {
    const rows = limitHeadroom(
      { ...USAGE, "session-replays": 0 },
      FREE_ALLOTMENTS,
      0
    );

    expect(rows.at(-1)).toMatchObject({
      allotment: { resource: "session-replays" },
      hitsAt: null,
    });
  });

  it("ignores a price a plan can buy more of: it is a rate, not a limit", () => {
    const rows = limitHeadroom(USAGE, PRO_DUBLIN, 0);

    expect(rows).toEqual([]);
  });
});
