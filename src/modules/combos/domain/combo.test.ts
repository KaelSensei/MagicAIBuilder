import { describe, expect, it } from "vitest";
import {
  isTwoCardInfiniteCombo,
  type Combo,
} from "@/modules/combos/domain/combo";

/** A combo as the panel and bracket scoring see it; the tests override what they read. */
function combo(overrides: Partial<Combo> = {}): Combo {
  return {
    id: "742-1295",
    cards: ["Demonic Consultation", "Thassa's Oracle"],
    effects: ["Exile your library", "Win the game"],
    description: "Cast Demonic Consultation naming Thassa's Oracle.",
    isInfinite: true,
    prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{U}{U}{B}" },
    ...overrides,
  };
}

describe("isTwoCardInfiniteCombo", () => {
  it("counts an infinite combo that uses exactly two named cards", () => {
    expect(isTwoCardInfiniteCombo(combo())).toBe(true);
  });

  it("does not count an infinite combo of three named cards", () => {
    const threeCards = combo({
      cards: ["Demonic Consultation", "Thassa's Oracle", "Sol Ring"],
    });

    expect(isTwoCardInfiniteCombo(threeCards)).toBe(false);
  });

  it("does not count an infinite combo of one named card", () => {
    expect(isTwoCardInfiniteCombo(combo({ cards: ["Thassa's Oracle"] }))).toBe(
      false
    );
  });

  it("does not count a two-card combo whose effects are not infinite", () => {
    const valueCombo = combo({ isInfinite: false, effects: ["Draw cards"] });

    expect(isTwoCardInfiniteCombo(valueCombo)).toBe(false);
  });

  it("currently counts two named cards as two cards even when Spellbook lists a generic third piece (pinned; roadmap I-77)", () => {
    const hullbreaker = combo({
      id: "513-5034--46",
      cards: ["Hullbreaker Horror", "Sol Ring"],
      effects: ["Infinite colorless mana"],
      prerequisites: {
        otherPieces: ["Permanent Castable for {C}"],
        conditions: [],
        manaNeeded: "",
      },
    });

    expect(isTwoCardInfiniteCombo(hullbreaker)).toBe(true);
  });
});
