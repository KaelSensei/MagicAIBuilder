import { describe, expect, it } from "vitest";
import {
  MAX_COMMANDERS,
  deckComboQueryKey,
  deckComboQuerySchema,
  normalizeDeckComboQuery,
} from "@/modules/combos/domain/deck-query";

describe("normalizeDeckComboQuery", () => {
  it("gives the same key to lists that differ only in order, case or spacing", () => {
    const a = normalizeDeckComboQuery({
      commanders: ["Kenrith"],
      main: ["Sol Ring", "Thassa's Oracle"],
    });
    const b = normalizeDeckComboQuery({
      commanders: [" kenrith "],
      main: ["THASSA'S  ORACLE", "sol ring", "Sol Ring"],
    });

    expect(deckComboQueryKey(b)).toBe(deckComboQueryKey(a));
    expect(b.main).toEqual(["sol ring", "thassa's oracle"]);
  });

  it("never repeats a commander in the main deck", () => {
    const query = normalizeDeckComboQuery({
      commanders: ["Kenrith"],
      main: ["Kenrith", "Sol Ring"],
    });

    expect(query).toEqual({ commanders: ["kenrith"], main: ["sol ring"] });
  });
});

describe("deckComboQuerySchema", () => {
  it("refuses more commanders than a deck can have", () => {
    const commanders = Array.from(
      { length: MAX_COMMANDERS + 1 },
      (_, i) => `Commander ${i}`
    );

    expect(
      deckComboQuerySchema.safeParse({ commanders, main: [] }).success
    ).toBe(false);
  });

  it("refuses a blank card name", () => {
    expect(
      deckComboQuerySchema.safeParse({ commanders: [], main: ["  "] }).success
    ).toBe(false);
  });
});
