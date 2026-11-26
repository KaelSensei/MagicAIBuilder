import { describe, expect, it } from "vitest";

import { chanceOfAtLeast } from "./draw-odds";

/** I-97 states its contract to four decimal places. */
const FOUR_DECIMALS = 4;

/**
 * Hands of seven from 99 cards that hold three or more of 36 lands, over all
 * hands of seven: Σ C(36, i) · C(63, 7 − i) for i = 3..7, over C(99, 7).
 * Computed once with exact integer arithmetic; it is the I-97 contract.
 */
const THREE_LANDS_IN_SEVEN_OF_99 = 26_736_733 / 53_358_536;

describe("chanceOfAtLeast", () => {
  it("gives the chance of three or more lands among seven cards drawn from a 99-card library holding 36 lands", () => {
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: 36, drawn: 7, minimum: 3 })
    ).toEqual({
      kind: "known",
      probability: expect.closeTo(THREE_LANDS_IN_SEVEN_OF_99, FOUR_DECIMALS),
    });
  });

  it("gives 7 in 99 for at least one copy of a single card among seven cards drawn from 99", () => {
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: 1, drawn: 7, minimum: 1 })
    ).toEqual({
      kind: "known",
      probability: expect.closeTo(7 / 99, FOUR_DECIMALS),
    });
  });

  it("names a minimum above the cards drawn, at least 3 in 2 cards, instead of answering zero", () => {
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: 36, drawn: 2, minimum: 3 })
    ).toEqual({ kind: "unknown", reason: "more-wanted-than-drawn" });
  });

  it("names a minimum one above the opening seven instead of answering a known zero", () => {
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: 36, drawn: 7, minimum: 8 })
    ).toEqual({ kind: "unknown", reason: "more-wanted-than-drawn" });
  });

  it("answers a minimum equal to the cards drawn: all seven of 36 lands", () => {
    // C(36, 7) / C(99, 7) = 8,347,680 / 14,887,031,544
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: 36, drawn: 7, minimum: 7 })
    ).toEqual({
      kind: "known",
      probability: expect.closeTo(8_347_680 / 14_887_031_544, 12),
    });
  });

  it("names a draw larger than the library before a minimum above the draw, as the player fixes the draw first", () => {
    expect(
      chanceOfAtLeast({ librarySize: 5, matching: 2, drawn: 7, minimum: 8 })
    ).toEqual({ kind: "unknown", reason: "more-drawn-than-library" });
  });

  it("names more matching cards than the library holds before a minimum above the draw", () => {
    expect(
      chanceOfAtLeast({ librarySize: 10, matching: 11, drawn: 2, minimum: 3 })
    ).toEqual({ kind: "unknown", reason: "more-matching-than-library" });
  });

  it("names an empty library instead of answering zero", () => {
    expect(
      chanceOfAtLeast({ librarySize: 0, matching: 0, drawn: 7, minimum: 3 })
    ).toEqual({ kind: "unknown", reason: "empty-library" });
  });

  it("names a draw larger than the library instead of answering", () => {
    expect(
      chanceOfAtLeast({ librarySize: 5, matching: 2, drawn: 7, minimum: 1 })
    ).toEqual({ kind: "unknown", reason: "more-drawn-than-library" });
  });

  it("names more matching cards than the library holds instead of answering zero", () => {
    expect(
      chanceOfAtLeast({ librarySize: 10, matching: 12, drawn: 7, minimum: 1 })
    ).toEqual({ kind: "unknown", reason: "more-matching-than-library" });
  });

  it("rejects a count that is not a whole number of cards", () => {
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: 36, drawn: 7.5, minimum: 3 })
    ).toEqual({ kind: "unknown", reason: "not-a-card-count" });
  });

  it("never reports more than certainty when the floating-point sum of hands drifts", () => {
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: 21, drawn: 14, minimum: 0 })
    ).toEqual({ kind: "known", probability: 1 });
  });

  it("rejects a negative count instead of answering zero", () => {
    expect(
      chanceOfAtLeast({ librarySize: 99, matching: -3, drawn: 7, minimum: 1 })
    ).toEqual({ kind: "unknown", reason: "not-a-card-count" });
  });
});
