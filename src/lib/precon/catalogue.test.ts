import { describe, expect, it } from "vitest";

import { recordPreconVersion, type PreconVersion } from "./catalogue";

const CARDS = [
  { scryfallId: "commander-printing", quantity: 1, zone: "commander" as const },
  { scryfallId: "sol-ring", quantity: 1, zone: "main" as const },
];

function version(overrides: Partial<PreconVersion> = {}): PreconVersion {
  return {
    id: "cmm-eldrazi",
    version: 1,
    setCode: "cmm",
    name: "Eldrazi Unbound",
    commanderOracleId: "zhulodok-oracle",
    releaseDate: "2023-08-04",
    sourceUrl: "https://mtgjson.com/sets/cmm/",
    sourceReadAt: "2026-11-20",
    cards: CARDS,
    ...overrides,
  };
}

describe("recordPreconVersion", () => {
  it("stores a dated printing-level list and keeps that version when a correction is added", () => {
    const first = recordPreconVersion([], version());
    expect(first.kind).toBe("recorded");
    if (first.kind !== "recorded") return;

    const solRing = {
      scryfallId: "sol-ring",
      quantity: 1,
      zone: "main" as const,
    };
    const cards = [CARDS[0], solRing];
    const second = recordPreconVersion(
      first.catalogue,
      version({ version: 2, cards })
    );
    solRing.quantity = 9;

    expect(second).toMatchObject({
      kind: "recorded",
      catalogue: [
        {
          version: 1,
          cards: [
            CARDS[0],
            { scryfallId: "sol-ring", quantity: 1, zone: "main" },
          ],
        },
        {
          version: 2,
          cards: [
            CARDS[0],
            { scryfallId: "sol-ring", quantity: 1, zone: "main" },
          ],
        },
      ],
    });
    expect(first.catalogue).toHaveLength(1);
  });

  it("refuses to write a version that already exists and leaves the catalogue as it was", () => {
    const stored = recordPreconVersion([], version());
    if (stored.kind !== "recorded") throw new Error("fixture");
    const before = stored.catalogue;

    const again = recordPreconVersion(
      before,
      version({ name: "Renamed in place" })
    );

    expect(again).toEqual({ kind: "rejected", reason: "existing-version" });
    expect(before).toEqual(stored.catalogue);
    expect(before[0]?.name).toBe("Eldrazi Unbound");
  });

  it("refuses a version that skips a number", () => {
    const stored = recordPreconVersion([], version());
    if (stored.kind !== "recorded") throw new Error("fixture");

    expect(
      recordPreconVersion(stored.catalogue, version({ version: 3 }))
    ).toEqual({
      kind: "rejected",
      reason: "version-gap",
    });
  });

  it("refuses a list with no cards, a bad date, or a quantity that is not a copy count", () => {
    expect(recordPreconVersion([], version({ cards: [] }))).toEqual({
      kind: "rejected",
      reason: "not-a-precon",
    });
    expect(
      recordPreconVersion([], version({ releaseDate: "2023-13-40" }))
    ).toEqual({
      kind: "rejected",
      reason: "not-a-precon",
    });
    expect(
      recordPreconVersion(
        [],
        version({
          cards: [{ scryfallId: "sol-ring", quantity: 0, zone: "main" }],
        })
      )
    ).toEqual({ kind: "rejected", reason: "not-a-precon" });
  });
});
