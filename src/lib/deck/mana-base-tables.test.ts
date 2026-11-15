import { describe, expect, it } from "vitest";

import { landCountTarget, sourceTarget } from "./mana-base-tables";

/** Karsten publishes his coefficients to two decimal places. */
const TWO_DECIMALS = 2;

describe("landCountTarget", () => {
  it("gives 40.81 lands for an average mana value of 3.0 with no cheap ramp or draw", () => {
    expect(
      landCountTarget({ averageManaValue: 3, cheapRampAndDraw: 0 })
    ).toEqual({ kind: "known", lands: expect.closeTo(40.81, TWO_DECIMALS) });
  });

  it("cuts 0.28 of a land per cheap ramp or draw piece: 38.01 with ten", () => {
    expect(
      landCountTarget({ averageManaValue: 3, cheapRampAndDraw: 10 })
    ).toEqual({ kind: "known", lands: expect.closeTo(38.01, TWO_DECIMALS) });
  });

  it("names a negative average mana value instead of answering", () => {
    expect(
      landCountTarget({ averageManaValue: -1, cheapRampAndDraw: 0 })
    ).toEqual({ kind: "unknown", reason: "not-a-mana-value" });
  });

  it("names a cheap-piece count that is not a whole number of cards", () => {
    expect(
      landCountTarget({ averageManaValue: 3, cheapRampAndDraw: 2.5 })
    ).toEqual({ kind: "unknown", reason: "not-a-card-count" });
  });
});

/**
 * Karsten's 99-card column, copied by hand from the I-58 spec's table
 * (docs/product/specs/i58-mana-base-builder.md, "Published method"), which
 * quotes "How Many Sources Do You Need…", 2022-08-02, updated 2025-02-13.
 * Each row: the cost pattern, its mana value, its coloured pips, the sources.
 */
const KARSTEN_99_CARD_COLUMN: readonly (readonly [string, number, number, number])[] = [
  ["C", 1, 1, 19],
  ["1C", 2, 1, 19],
  ["2C", 3, 1, 18],
  ["3C", 4, 1, 16],
  ["4C", 5, 1, 15],
  ["5C", 6, 1, 14],
  ["CC", 2, 2, 30],
  ["1CC", 3, 2, 28],
  ["2CC", 4, 2, 26],
  ["3CC", 5, 2, 23],
  ["4CC", 6, 2, 22],
  ["5CC", 7, 2, 20],
  ["CCC", 3, 3, 36],
  ["1CCC", 4, 3, 33],
  ["2CCC", 5, 3, 30],
  ["3CCC", 6, 3, 28],
  ["4CCC", 7, 3, 26],
  ["CCCC", 4, 4, 39],
  ["1CCCC", 5, 4, 36],
];

describe("sourceTarget", () => {
  it.each(KARSTEN_99_CARD_COLUMN)(
    "returns Karsten's %s entry: mana value %i with %i pips needs %i sources",
    (entry, manaValue, pips, sources) => {
      expect(sourceTarget({ manaValue, pips })).toEqual({
        kind: "exact",
        entry,
        sources,
      });
    }
  );

  it("uses the entry with the same pips and the nearest lower mana value for a cost beyond the column, and says so", () => {
    // {6}{G}{G}: mana value 8, two green pips; the column stops at 5CC.
    expect(sourceTarget({ manaValue: 8, pips: 2 })).toEqual({
      kind: "nearest-lower",
      asked: "6CC",
      entry: "5CC",
      sources: 20,
    });
  });

  it("gives no number for five pips of one colour, which the column does not publish", () => {
    expect(sourceTarget({ manaValue: 5, pips: 5 })).toEqual({
      kind: "outside-table",
      reason: "pips-not-in-table",
    });
  });

  it("gives no number for a spell with no pip of the colour", () => {
    expect(sourceTarget({ manaValue: 3, pips: 0 })).toEqual({
      kind: "outside-table",
      reason: "pips-not-in-table",
    });
  });

  it("names a cost whose pips exceed its mana value instead of answering", () => {
    expect(sourceTarget({ manaValue: 1, pips: 2 })).toEqual({
      kind: "outside-table",
      reason: "not-a-cost",
    });
  });
});
