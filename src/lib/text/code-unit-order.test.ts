import { describe, expect, it } from "vitest";

import { compareCodeUnits } from "./code-unit-order";

describe("compareCodeUnits", () => {
  it("orders digits, then capitals, then lower case, then accented letters", () => {
    expect(["é", "e", "Z", "a", "9", "10"].toSorted(compareCodeUnits)).toEqual([
      "10",
      "9",
      "Z",
      "a",
      "e",
      "é",
    ]);
  });

  it("orders a character outside the Basic Multilingual Plane by its surrogates", () => {
    // U+1F600 is stored as D83D DE00, which comes before U+FF5E.
    expect(["～", "\u{1F600}"].toSorted(compareCodeUnits)).toEqual([
      "\u{1F600}",
      "～",
    ]);
  });

  it("answers zero for equal strings and opposite signs for swapped ones", () => {
    expect(compareCodeUnits("W", "W")).toBe(0);
    expect(compareCodeUnits("B", "G")).toBeLessThan(0);
    expect(compareCodeUnits("G", "B")).toBeGreaterThan(0);
  });
});
