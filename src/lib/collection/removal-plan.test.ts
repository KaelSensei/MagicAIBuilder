import { describe, expect, it } from "vitest";
import { planCollectionRemoval } from "./removal-plan";

describe("planCollectionRemoval", () => {
  it("preserves copies beyond what the deck requires", () => {
    expect(
      planCollectionRemoval(
        { card: 1 },
        { card: { id: "normal", quantity: 3 } },
        { card: { id: "foil", quantity: 2 } }
      )
    ).toEqual([{ id: "normal", nextQuantity: 2 }]);
  });

  it("uses foil copies only after normal copies", () => {
    expect(
      planCollectionRemoval(
        { card: 4 },
        { card: { id: "normal", quantity: 3 } },
        { card: { id: "foil", quantity: 2 } }
      )
    ).toEqual([
      { id: "normal", nextQuantity: 0 },
      { id: "foil", nextQuantity: 1 },
    ]);
  });
});
