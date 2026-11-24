import { describe, expect, it } from "vitest";
import { minimumBracket, restrictionFloor } from "./bracket-floor";

/**
 * The lowest bracket whose official rules admit what a deck list shows
 * (bracket text of 2025-10-21): Brackets 1–2 allow no Game Changers and no
 * two-card combos, Bracket 3 up to three Game Changers and two-card combos
 * that do not come up before turn 6, Brackets 4–5 anything legal.
 */
describe("minimumBracket", () => {
  it.each([
    { gameChangers: 0, twoCardCombos: 0, floor: 1 },
    { gameChangers: 1, twoCardCombos: 0, floor: 3 },
    { gameChangers: 3, twoCardCombos: 0, floor: 3 },
    { gameChangers: 4, twoCardCombos: 0, floor: 4 },
    { gameChangers: 0, twoCardCombos: 1, floor: 3 },
    { gameChangers: 0, twoCardCombos: 5, floor: 3 },
    { gameChangers: 2, twoCardCombos: 1, floor: 3 },
    { gameChangers: 4, twoCardCombos: 1, floor: 4 },
  ])(
    "$gameChangers Game Changers and $twoCardCombos two-card combos → Bracket $floor",
    ({ gameChangers, twoCardCombos, floor }) => {
      expect(minimumBracket({ gameChangers, twoCardCombos })).toBe(floor);
    }
  );

  it("never reaches Bracket 5: only the cEDH metagame separates it from Bracket 4", () => {
    expect(minimumBracket({ gameChangers: 40, twoCardCombos: 12 })).toBe(4);
  });
});

/**
 * The floor one restriction method version 1 counts but does not let set the
 * estimate: mass land denial is allowed from Bracket 4, extra turns from
 * Bracket 2, where they may not be chained (a list cannot show chaining).
 */
describe("restrictionFloor", () => {
  it.each([
    { rule: "massLandDenial", count: 0, floor: 1 },
    { rule: "massLandDenial", count: 1, floor: 4 },
    { rule: "massLandDenial", count: 6, floor: 4 },
    { rule: "extraTurns", count: 0, floor: 1 },
    { rule: "extraTurns", count: 1, floor: 2 },
    { rule: "extraTurns", count: 9, floor: 2 },
  ] as const)(
    "$count $rule cards → Bracket $floor",
    ({ rule, count, floor }) => {
      expect(restrictionFloor(rule, count)).toBe(floor);
    }
  );
});
