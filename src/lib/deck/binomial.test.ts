/**
 * Characterization of the shared binomial coefficient, pinned when it moved out
 * of turn-one.ts. Expected counts come from Python's exact `math.comb`.
 */
import { describe, expect, it } from "vitest";

import { binomial } from "./binomial";

describe("binomial", () => {
  it("characterization: counts the seven-card hands of a 99-card library exactly", () => {
    expect(binomial(99, 7)).toBe(14_887_031_544);
  });

  it("characterization: counts choosing all but seven the same as choosing seven", () => {
    expect(binomial(99, 92)).toBe(14_887_031_544);
  });

  it("characterization: counts one way to choose nothing, even from nothing", () => {
    expect(binomial(0, 0)).toBe(1);
  });

  it("characterization: counts no way to choose more than the set holds", () => {
    expect(binomial(5, 7)).toBe(0);
  });

  it("characterization: counts no way to make a negative selection", () => {
    expect(binomial(5, -1)).toBe(0);
    expect(binomial(-1, 0)).toBe(0);
  });
});
