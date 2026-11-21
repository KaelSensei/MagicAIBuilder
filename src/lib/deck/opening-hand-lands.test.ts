import { describe, expect, it } from "vitest";

import type { TableSize } from "./cards-drawn";
import { chanceOfAtLeast, type DrawOdds } from "./draw-odds";
import type { LibraryCount } from "./draw-odds-library";
import { openingHandLands } from "./opening-hand-lands";

/** I-97's Commander library: 99 cards, 36 of them lands (CR 903.6). */
const COMMANDER_LIBRARY: LibraryCount = { librarySize: 99, matching: 36 };

/**
 * The figures for a library that has them; fails the test with the reason
 * when the function answers with a gap instead.
 */
function figuresOf(library: LibraryCount, table: TableSize = "multiplayer") {
  const result = openingHandLands(library, table);
  if (result.kind !== "known") {
    throw new Error(`expected figures, got the gap "${result.reason}"`);
  }
  return result;
}

/** The probability of a known answer; fails the test on a gap. */
function probabilityOf(odds: DrawOdds): number {
  if (odds.kind !== "known") {
    throw new Error(`expected a chance, got the gap "${odds.reason}"`);
  }
  return odds.probability;
}

describe("openingHandLands", () => {
  it("averages 2.545 lands in an opening seven from a 99-card library with 36 lands, to three decimals", () => {
    // 7 × 36 / 99 = 2.5454…
    expect(figuresOf(COMMANDER_LIBRARY).averageLands).toBeCloseTo(2.545, 3);
  });

  it("gives the chance of exactly 0 to 7 lands in the opening seven, in order", () => {
    expect(figuresOf(COMMANDER_LIBRARY).spread.map((row) => row.lands)).toEqual(
      [0, 1, 2, 3, 4, 5, 6, 7]
    );
  });

  it("gives a spread for that library that adds up to 1 within 1e-12", () => {
    const total = figuresOf(COMMANDER_LIBRARY).spread.reduce(
      (sum, row) => sum + row.probability,
      0
    );

    expect(Math.abs(total - 1)).toBeLessThan(1e-12);
  });

  it("gives the committed chance of exactly two lands in seven, to four decimals", () => {
    // C(36, 2) · C(63, 5) / C(99, 7) = 1,133,685 / 3,811,324 ≈ 0.29745,
    // computed once with exact integer arithmetic (I-97's contract).
    const twoLands = figuresOf(COMMANDER_LIBRARY).spread.find(
      (row) => row.lands === 2
    );

    expect(twoLands?.probability).toBeCloseTo(1_133_685 / 3_811_324, 4);
    expect(twoLands?.probability).toBeCloseTo(0.2975, 4);
  });

  it("gives a land drop for each turn from 1 to 7", () => {
    expect(
      figuresOf(COMMANDER_LIBRARY).landDrops.map((drop) => drop.turn)
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("gives turn 3 at a multiplayer table the chance of at least 3 lands among 10 cards drawn, as chanceOfAtLeast counts it", () => {
    const turnThree = figuresOf(COMMANDER_LIBRARY, "multiplayer").landDrops[2];

    // CR 103.8c: nobody skips the first draw at a multiplayer table, so the
    // opening seven and three draws make ten cards.
    expect(turnThree?.drawn).toBe(10);
    expect(turnThree?.probability).toBe(
      probabilityOf(
        chanceOfAtLeast({
          librarySize: 99,
          matching: 36,
          drawn: 10,
          minimum: 3,
        })
      )
    );
    // 327,687,835 / 419,847,428 ≈ 0.78049
    expect(turnThree?.probability).toBeCloseTo(0.7805, 4);
  });

  it("draws 9 cards by turn 3 in a two-player game, where the starting player skips the first draw", () => {
    const turnThree = figuresOf(COMMANDER_LIBRARY, "two-player").landDrops[2];

    // CR 103.8a: the starting player of a two-player game skips the turn-1 draw.
    expect(turnThree?.drawn).toBe(9);
    // 295,750,309 / 419,847,428 ≈ 0.70442
    expect(turnThree?.probability).toBeCloseTo(0.7044, 4);
  });

  it("stops the land drops at the last turn a short library can cover, instead of showing a zero", () => {
    // Ten cards: the opening seven and three multiplayer draws (CR 103.8c).
    const drops = figuresOf({ librarySize: 10, matching: 4 }).landDrops;

    expect(drops.map((drop) => drop.turn)).toEqual([1, 2, 3]);
  });
});

describe("openingHandLands, when there is nothing to count", () => {
  it("names an empty library instead of answering with figures", () => {
    expect(
      openingHandLands({ librarySize: 0, matching: 0 }, "multiplayer")
    ).toEqual({ kind: "unknown", reason: "empty-library" });
  });

  it("names a library without lands instead of a table of zeros (AC-97-05)", () => {
    expect(
      openingHandLands({ librarySize: 60, matching: 0 }, "two-player")
    ).toEqual({ kind: "unknown", reason: "no-lands" });
  });

  it("names a library shorter than an opening seven instead of a spread no hand can be dealt from", () => {
    expect(
      openingHandLands({ librarySize: 5, matching: 2 }, "multiplayer")
    ).toEqual({ kind: "unknown", reason: "more-drawn-than-library" });
  });
});
