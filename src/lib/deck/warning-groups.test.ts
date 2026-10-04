import { describe, expect, it } from "vitest";
import { groupDeckWarnings } from "./warning-groups";

describe("groupDeckWarnings", () => {
  it("separates hard legality errors from strategy and optional advice", () => {
    const grouped = groupDeckWarnings([
      "Banned cards in deck: Griselbrand",
      "Color identity violations: Lightning Bolt",
      "Deck has only 90/100 cards",
      "Low ramp count (4) — recommend 8–12",
      "2-card combo detected — target is Bracket 1",
      "3 Game Changer(s): Rhystic Study",
    ]);

    expect(grouped.legality).toEqual([
      "Banned cards in deck: Griselbrand",
      "Color identity violations: Lightning Bolt",
      "Deck has only 90/100 cards",
    ]);
    expect(grouped.strategy).toEqual([
      "Low ramp count (4) — recommend 8–12",
      "2-card combo detected — target is Bracket 1",
    ]);
    expect(grouped.advice).toEqual([
      "3 Game Changer(s): Rhystic Study",
    ]);
  });

  it("keeps unknown warnings visible as optional advice", () => {
    expect(groupDeckWarnings(["Review this unusual interaction"]).advice).toEqual([
      "Review this unusual interaction",
    ]);
  });

  it("classifies the validator's incomplete-deck message as a legality warning", () => {
    const warning = "Deck has 92/100 cards — needs 8 more";

    expect(groupDeckWarnings([warning]).legality).toEqual([warning]);
  });

  it("classifies a Game Changer bracket floor as strategy, not optional advice", () => {
    const warning = "4 Game Changers detected — deck is Bracket 4 minimum";

    expect(groupDeckWarnings([warning]).strategy).toEqual([warning]);
  });
});
