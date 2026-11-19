/**
 * The size rule of a stored deck in its own format: whether the format holds
 * the deck to an exact size or to a minimum, and how a counter shows it.
 *
 * CR 100.2a: a constructed deck has a minimum size of 60 cards and no
 * maximum. CR 903.5a: a Commander deck holds exactly 100 cards. CR 903.12d: a
 * Brawl deck holds exactly 60. Oathbreaker: exactly 60 cards
 * (https://oathbreakermtg.org/rules/, read 2026-11-19).
 */
import { describe, expect, it } from "vitest";
import { deckSizeStatus } from "@/modules/format-rules";
import { aDeck } from "@/test/builders/deck";
import { deckSizeRuleInFormat, formatDeckCount } from "./deck-size";
import type { DeckFormat } from "./formats";

/** The formats held to a 60-card minimum with no maximum (CR 100.2a). */
const CONSTRUCTED_FORMATS: readonly DeckFormat[] = [
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "pauper",
];

/** The formats held to exactly 60 cards (CR 903.12d; Oathbreaker rules). */
const EXACT_SIXTY_FORMATS: readonly DeckFormat[] = ["brawl", "oathbreaker"];

/** The size rule of a deck in `format` with no commander yet. */
function ruleIn(format: DeckFormat) {
  return deckSizeRuleInFormat(aDeck({ format }));
}

describe("the deck size rule of a format", () => {
  it("reads a 63-card Modern deck as complete (CR 100.2a)", () => {
    expect(deckSizeStatus(63, ruleIn("modern"))).toBe("legal");
  });

  it("reads a 59-card Modern deck as short of its minimum", () => {
    expect(deckSizeStatus(59, ruleIn("modern"))).toBe("short");
  });

  it.each(CONSTRUCTED_FORMATS)(
    "never reads a %s deck as over, at any size from 60 up",
    (format) => {
      expect(
        [60, 61, 75, 250].map((count) => deckSizeStatus(count, ruleIn(format)))
      ).toEqual(["legal", "legal", "legal", "legal"]);
    }
  );

  // CR 903.12d (Brawl) and the Oathbreaker rules: exactly 60, like Commander's 100.
  it.each(EXACT_SIXTY_FORMATS)(
    "holds a %s deck to exactly 60 cards",
    (format) => {
      expect(
        [59, 60, 61].map((count) => deckSizeStatus(count, ruleIn(format)))
      ).toEqual(["short", "legal", "over"]);
    }
  );

  it("still holds a Commander deck to exactly 100 cards (CR 903.5a)", () => {
    expect(
      [99, 100, 101].map((count) => deckSizeStatus(count, ruleIn("commander")))
    ).toEqual(["short", "legal", "over"]);
  });
});

describe("the counter text of a deck", () => {
  it("shows a Modern deck's count against its minimum, marked as a minimum", () => {
    expect(formatDeckCount(63, ruleIn("modern"), "/")).toBe("63/60+");
  });

  it("shows an exact format's count against its size, unmarked", () => {
    expect(formatDeckCount(99, ruleIn("commander"), " / ")).toBe("99 / 100");
    expect(formatDeckCount(60, ruleIn("brawl"), "/")).toBe("60/60");
  });
});
