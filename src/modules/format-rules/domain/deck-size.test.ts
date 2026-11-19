/**
 * The deck size rule: the size and bound a format sets, and where a card count
 * stands against it (CR 903.5a exact, CR 100.2a minimum).
 */
import { describe, expect, it } from "vitest";
import { deckSizeRule, deckSizeStatus, type FormatDeckSize } from "./deck-size";

/** Commander's size: exactly 100 cards (CR 903.5a). */
const COMMANDER: FormatDeckSize = { cards: 100, bound: "exact" };
/** A constructed format's size: at least 60 cards (CR 100.2a). */
const CONSTRUCTED: FormatDeckSize = { cards: 60, bound: "minimum" };

describe("deckSizeRule", () => {
  it("holds a deck to exactly the format's size", () => {
    expect(deckSizeRule(COMMANDER, [])).toEqual({
      minimum: 100,
      maximum: 100,
      formatBound: "exact",
    });
  });

  it("keeps the minimum but drops the maximum when a rulebreaker lifts it (CR 903.5e)", () => {
    expect(deckSizeRule(COMMANDER, [{ kind: "no-maximum-deck-size" }])).toEqual(
      { minimum: 100, maximum: null, formatBound: "exact" }
    );
  });

  it("keeps the maximum for a rulebreaker that only changes colour identity", () => {
    expect(deckSizeRule(COMMANDER, [{ kind: "any-basic-land" }])).toEqual({
      minimum: 100,
      maximum: 100,
      formatBound: "exact",
    });
  });

  it("sets a minimum and no maximum for a constructed format (CR 100.2a)", () => {
    expect(deckSizeRule(CONSTRUCTED, [])).toEqual({
      minimum: 60,
      maximum: null,
      formatBound: "minimum",
    });
  });
});

describe("deckSizeStatus", () => {
  const commander = deckSizeRule(COMMANDER, []);
  const unbounded = deckSizeRule(COMMANDER, [{ kind: "no-maximum-deck-size" }]);
  const constructed = deckSizeRule(CONSTRUCTED, []);

  it("reads any count from the minimum up as legal when the deck has no maximum", () => {
    expect(
      [99, 100, 250].map((count) => deckSizeStatus(count, unbounded))
    ).toEqual(["short", "legal", "legal"]);
  });

  it("reads a 99-card Commander deck as short", () => {
    expect(deckSizeStatus(99, commander)).toBe("short");
  });

  it("reads a 100-card Commander deck as legal (CR 903.5a)", () => {
    expect(deckSizeStatus(100, commander)).toBe("legal");
  });

  it("reads a 101-card Commander deck as over", () => {
    expect(deckSizeStatus(101, commander)).toBe("over");
  });

  it("reads a constructed deck as short under 60, and as legal from 60 up with no maximum (CR 100.2a)", () => {
    expect(
      [59, 60, 63, 250].map((count) => deckSizeStatus(count, constructed))
    ).toEqual(["short", "legal", "legal", "legal"]);
  });
});
