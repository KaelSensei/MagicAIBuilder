import { describe, expect, it } from "vitest";

import { landCountTarget } from "./mana-base-tables";

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
