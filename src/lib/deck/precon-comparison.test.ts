import { describe, expect, it } from "vitest";

import type { BracketFloorRow } from "./bracket-assessment";
import {
  COMPARISON_ROWS,
  comparePrecons,
  type PreconSignals,
} from "./precon-comparison";
import type { Catalogue, PreconVersion } from "@/lib/precon/catalogue";

const FOUNDATIONS_DECKS = [
  "fdc-white",
  "fdc-blue",
  "fdc-black",
  "fdc-red",
  "fdc-green",
] as const;

function precon(overrides: Partial<PreconVersion> = {}): PreconVersion {
  return {
    id: "fdc-white",
    version: 1,
    setCode: "fdc",
    name: "Foundations deck",
    commanderOracleId: "commander-oracle",
    releaseDate: "2024-11-15",
    sourceUrl: "https://mtgjson.com/sets/fdc/",
    sourceReadAt: "2026-11-20",
    cards: [
      { scryfallId: "commander-printing", quantity: 1, zone: "commander" },
      { scryfallId: "plains", quantity: 37, zone: "main" },
      { scryfallId: "sol-ring", quantity: 1, zone: "main" },
      { scryfallId: "lightning-greaves", quantity: 61, zone: "main" },
    ],
    ...overrides,
  };
}

const FOUNDATIONS: Catalogue = FOUNDATIONS_DECKS.map((id) =>
  precon({ id, name: id })
);

const GAME_CHANGER_FLOOR: BracketFloorRow = {
  status: "checked",
  rule: "gameChangers",
  count: 1,
  certainty: "exact",
  cards: ["The One Ring"],
  floor: 3,
  ruleRef: "2025-10-21:gameChangers",
};

function rowOf(
  comparison: ReturnType<typeof comparePrecons>,
  row: (typeof COMPARISON_ROWS)[number]
) {
  if (comparison.kind !== "compared") throw new Error("expected a line");
  const found = comparison.rows.find((entry) => entry.row === row);
  if (found === undefined) throw new Error(`no ${row} row`);
  return found;
}

describe("comparePrecons", () => {
  it("shows a line of five decks with no play-style output as five play-style cells not computed yet, owned by I-54", () => {
    const comparison = comparePrecons(FOUNDATIONS, "fdc", new Map());

    expect(rowOf(comparison, "playStyles").cells).toEqual(
      FOUNDATIONS_DECKS.map((deckId) => ({
        deckId,
        label: "notComputedYet",
        owner: "I-54",
      }))
    );
  });

  it("gives one column per deck of the line, in catalogue order, and leaves other lines out", () => {
    const catalogue: Catalogue = [
      ...FOUNDATIONS,
      precon({ id: "pip-hail", setCode: "pip", name: "Hail, Caesar" }),
    ];

    const comparison = comparePrecons(catalogue, "fdc", new Map());

    expect(comparison.kind).toBe("compared");
    if (comparison.kind !== "compared") return;
    expect(comparison.line).toBe("fdc");
    expect(comparison.decks.map((deck) => deck.id)).toEqual(FOUNDATIONS_DECKS);
    for (const row of comparison.rows) {
      expect(row.cells.map((cell) => cell.deckId)).toEqual(FOUNDATIONS_DECKS);
    }
  });

  it("lists the rows in the spec's order and never a power or score row", () => {
    const comparison = comparePrecons(FOUNDATIONS, "fdc", new Map());

    expect(COMPARISON_ROWS).toEqual([
      "colourIdentity",
      "sealedListSize",
      "playStyles",
      "routes",
      "pilotLoad",
      "bracketFloors",
      "priceVsSealed",
      "firstBundleCost",
    ]);
    expect(
      comparison.kind === "compared" && comparison.rows.map((row) => row.row)
    ).toEqual(COMPARISON_ROWS);
    for (const row of COMPARISON_ROWS) {
      expect(row).not.toMatch(/power|score|rating|winRate/i);
    }
  });

  it("counts the sealed list's copies, commander included, as an exact I-17 figure dated by the source read", () => {
    const comparison = comparePrecons(FOUNDATIONS, "fdc", new Map());

    expect(rowOf(comparison, "sealedListSize").cells[0]).toEqual({
      deckId: "fdc-white",
      label: "exact",
      owner: "I-17",
      asOf: "2026-11-20",
      value: 100,
    });
  });

  it("compares only the latest version of a corrected list", () => {
    const corrected = precon({
      version: 2,
      sourceReadAt: "2026-11-21",
      cards: [
        { scryfallId: "commander-printing", quantity: 1, zone: "commander" },
        { scryfallId: "plains", quantity: 99, zone: "main" },
      ],
    });

    const comparison = comparePrecons([precon(), corrected], "fdc", new Map());

    expect(comparison.kind === "compared" && comparison.decks).toEqual([
      {
        id: "fdc-white",
        version: 2,
        name: "Foundations deck",
        commanderOracleId: "commander-oracle",
      },
    ]);
    expect(rowOf(comparison, "sealedListSize").cells).toEqual([
      expect.objectContaining({ value: 100, asOf: "2026-11-21" }),
    ]);
  });

  it("shows the colour identity and the I-77 floors the sealed list trips, each with its owner's label and date", () => {
    const signals = new Map<string, PreconSignals>([
      [
        "fdc-white",
        {
          listVersion: 1,
          colourIdentity: { value: ["W"], asOf: "2026-11-19" },
          bracketFloors: {
            floor: 3,
            rows: [GAME_CHANGER_FLOOR],
            asOf: "2026-11-18",
          },
        },
      ],
    ]);

    const comparison = comparePrecons(FOUNDATIONS, "fdc", signals);

    expect(rowOf(comparison, "colourIdentity").cells[0]).toEqual({
      deckId: "fdc-white",
      label: "exact",
      owner: "I-17",
      asOf: "2026-11-19",
      value: ["W"],
    });
    expect(rowOf(comparison, "bracketFloors").cells[0]).toEqual({
      deckId: "fdc-white",
      label: "computed",
      owner: "I-77",
      asOf: "2026-11-18",
      value: { floor: 3, rows: [GAME_CHANGER_FLOOR] },
    });
    expect(rowOf(comparison, "bracketFloors").cells[1]).toEqual({
      deckId: "fdc-blue",
      label: "notComputedYet",
      owner: "I-77",
    });
  });

  it("does not show a signal read from an earlier version of the sealed list", () => {
    const signals = new Map<string, PreconSignals>([
      [
        "fdc-white",
        {
          listVersion: 1,
          colourIdentity: { value: ["W"], asOf: "2026-11-19" },
          bracketFloors: { floor: 1, rows: [], asOf: "2026-11-18" },
        },
      ],
    ]);

    const comparison = comparePrecons(
      [precon(), precon({ version: 2 })],
      "fdc",
      signals
    );

    expect(rowOf(comparison, "colourIdentity").cells).toEqual([
      { deckId: "fdc-white", label: "notComputedYet", owner: "I-17" },
    ]);
    expect(rowOf(comparison, "bracketFloors").cells).toEqual([
      { deckId: "fdc-white", label: "notComputedYet", owner: "I-77" },
    ]);
  });

  it("marks every row of signals no initiative computes yet as not computed, with its owner", () => {
    const comparison = comparePrecons(FOUNDATIONS, "fdc", new Map());

    const owners = (
      ["routes", "pilotLoad", "priceVsSealed", "firstBundleCost"] as const
    ).map((row) => rowOf(comparison, row).cells[0]);

    expect(owners).toEqual([
      { deckId: "fdc-white", label: "notComputedYet", owner: "I-65" },
      { deckId: "fdc-white", label: "notComputedYet", owner: "I-99" },
      { deckId: "fdc-white", label: "notComputedYet", owner: "I-32" },
      { deckId: "fdc-white", label: "notComputedYet", owner: "I-17" },
    ]);
  });

  it("answers an unknown line instead of an empty table", () => {
    expect(comparePrecons(FOUNDATIONS, "pip", new Map())).toEqual({
      kind: "unknownLine",
      line: "pip",
    });
  });
});
