import { describe, expect, it } from "vitest";
import { buildSuggestionImpact } from "./suggestion-impact";

describe("buildSuggestionImpact", () => {
  it("projects card count, average mana value and known price after selected changes", () => {
    const impact = buildSuggestionImpact(
      [
        { name: "Island", quantity: 2, manaValue: 0, priceUsd: 0.25 },
        { name: "Expensive Spell", quantity: 1, manaValue: 6, priceUsd: 4 },
      ],
      [
        {
          name: "Arcane Signet",
          manaValue: 2,
          priceUsd: 1.5,
          colorCompatible: true,
          commanderLegal: true,
          verified: true,
        },
      ],
      ["Expensive Spell"]
    );

    expect(impact).toEqual({
      before: { cards: 3, averageManaValue: 2, knownPriceUsd: 4.5 },
      after: { cards: 3, averageManaValue: 0.67, knownPriceUsd: 2 },
      unverifiedAdditions: 0,
      incompatibleAdditions: [],
      illegalAdditions: [],
    });
  });

  it("keeps unknown evidence out of numeric projections and reports its limits", () => {
    const impact = buildSuggestionImpact(
      [{ name: "Island", quantity: 1, manaValue: 0, priceUsd: null }],
      [
        {
          name: "Unknown Card",
          manaValue: null,
          priceUsd: null,
          colorCompatible: null,
          commanderLegal: null,
          verified: false,
        },
        {
          name: "Off-color Card",
          manaValue: 3,
          priceUsd: 2,
          colorCompatible: false,
          commanderLegal: false,
          verified: true,
        },
      ],
      []
    );

    expect(impact.unverifiedAdditions).toBe(1);
    expect(impact.incompatibleAdditions).toEqual(["Off-color Card"]);
    expect(impact.illegalAdditions).toEqual(["Off-color Card"]);
    expect(impact.after.cards).toBe(3);
    expect(impact.after.averageManaValue).toBe(1.5);
  });
});
