/**
 * `scoreBracket` keeps the numbers the builder shows today (I-77 slice 1).
 *
 * The builder's bracket badge reads `scoreBracket` (`useBracketScore`). This
 * slice makes it a projection of `explainBracket` and must move no number,
 * including on a list under 60 cards, where the audit counts the floors only
 * (requirement 2.6) but the badge still shows the heuristic.
 */
import { describe, expect, it } from "vitest";
import { scoreBracket } from "@/lib/deck/bracket";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck } from "@/lib/deck/types";
import { aDeck } from "@/test/builders/deck";
import { aThirtyCardList } from "@/lib/deck/testing/bracket-decks";

/** The builder's computation: stats from the deck, then the score. */
function builderScore(deck: Deck) {
  return scoreBracket(deck, computeDeckStats(deck));
}

describe("scoreBracket on a list under 60 cards (pinned: the badge shows the heuristic)", () => {
  it("scores an empty Commander deck at Bracket 2 from its heuristic, as it does today", () => {
    expect(builderScore(aDeck())).toEqual({
      overall: 2,
      dimensions: { ramp: 3, draw: 1, removal: 1, winSpeed: 2, avgCmc: 4 },
      gameChangers: 0,
      twoCardInfiniteCombos: 0,
      warnings: [
        "Low ramp count (0) — recommend 8–12",
        "Low card draw (0) — recommend 8–12",
        "Low land count (0) — recommend 33–38",
        "Deck has only 0/100 cards",
      ],
    });
  });

  it("scores a 30-card list at Bracket 3 from its heuristic, as it does today", () => {
    expect(builderScore(aDeck({ cards: aThirtyCardList() }))).toEqual({
      overall: 3,
      dimensions: { ramp: 3, draw: 2, removal: 2, winSpeed: 2, avgCmc: 4 },
      gameChangers: 0,
      twoCardInfiniteCombos: 0,
      warnings: [
        "Low ramp count (5) — recommend 8–12",
        "Low land count (10) — recommend 33–38",
        "Deck has only 30/100 cards",
      ],
    });
  });
});
