import { describe, it, expect } from "vitest";
import { MDFC_LAYOUTS, MANA_IMBALANCE_THRESHOLD } from "./constants";

describe("MDFC_LAYOUTS", () => {
  it("contains exactly the three DFC layouts", () => {
    expect(MDFC_LAYOUTS).toEqual(["modal_dfc", "transform", "reversible_card"]);
    expect(MDFC_LAYOUTS).toHaveLength(3);
  });
});

describe("MANA_IMBALANCE_THRESHOLD", () => {
  it("is 15", () => {
    expect(MANA_IMBALANCE_THRESHOLD).toBe(15);
  });
});
