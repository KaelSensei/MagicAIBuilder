import { describe, it, expect } from "vitest";
import { MANA_IMBALANCE_THRESHOLD } from "./constants";

describe("MANA_IMBALANCE_THRESHOLD", () => {
  it("is 15", () => {
    expect(MANA_IMBALANCE_THRESHOLD).toBe(15);
  });
});
