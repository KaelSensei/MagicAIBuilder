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
});
