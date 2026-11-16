/**
 * The deck size rule: the size a format sets, and where a card count stands
 * against it (CR 903.5a).
 */
import { describe, expect, it } from "vitest";
import { deckSizeRule, deckSizeStatus } from "./deck-size";

describe("deckSizeRule", () => {
  it("holds a deck to exactly the format's size", () => {
    expect(deckSizeRule(100)).toEqual({ minimum: 100, maximum: 100 });
  });
});

describe("deckSizeStatus", () => {
  const commander = deckSizeRule(100);

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
