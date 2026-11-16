/**
 * The deck size rule: the size a format sets, and where a card count stands
 * against it (CR 903.5a).
 */
import { describe, expect, it } from "vitest";
import { deckSizeRule, deckSizeStatus } from "./deck-size";

describe("deckSizeRule", () => {
  it("holds a deck to exactly the format's size", () => {
    expect(deckSizeRule(100, [])).toEqual({ minimum: 100, maximum: 100 });
  });

  it("keeps the minimum but drops the maximum when a rulebreaker lifts it (CR 903.5e)", () => {
    expect(deckSizeRule(100, [{ kind: "no-maximum-deck-size" }])).toEqual({
      minimum: 100,
      maximum: null,
    });
  });

  it("keeps the maximum for a rulebreaker that only changes colour identity", () => {
    expect(deckSizeRule(100, [{ kind: "any-basic-land" }])).toEqual({
      minimum: 100,
      maximum: 100,
    });
  });
});

describe("deckSizeStatus", () => {
  const commander = deckSizeRule(100, []);
  const unbounded = deckSizeRule(100, [{ kind: "no-maximum-deck-size" }]);

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
});
