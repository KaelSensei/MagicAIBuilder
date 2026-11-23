import { describe, expect, it } from "vitest";
import {
  DECK_STAGES,
  DEFAULT_DECK_STAGE,
  isDeckStage,
  stageRules,
} from "./deck-stage";

/**
 * The counting rules of a deck's place in the roster (I-114 2.1–2.2): a
 * retired deck commits no copy and leaves the acquisition plan; a resting
 * deck keeps its copies and leaves the plan by default; a deck in rotation
 * counts everywhere, as every deck does today.
 */
describe("stageRules", () => {
  it("a deck in rotation commits its copies, feeds the plan, appears in pickers and counts as active", () => {
    expect(stageRules("inRotation")).toEqual({
      commitsCopies: true,
      feedsPlan: true,
      inPickers: true,
      countsAsActive: true,
    });
  });

  it("a resting deck keeps its copies committed but feeds no plan by default", () => {
    const rules = stageRules("resting");

    expect(rules.commitsCopies).toBe(true);
    expect(rules.feedsPlan).toBe(false);
  });

  it("a resting deck stays in pickers but is not counted as in rotation", () => {
    const rules = stageRules("resting");

    expect(rules.inPickers).toBe(true);
    expect(rules.countsAsActive).toBe(false);
  });

  it("a retired deck commits no copy, feeds no plan, leaves pickers and is not active", () => {
    expect(stageRules("retired")).toEqual({
      commitsCopies: false,
      feedsPlan: false,
      inPickers: false,
      countsAsActive: false,
    });
  });

  it("only a deck in rotation counts toward the roster, so 'in rotation' is the active count", () => {
    const active = DECK_STAGES.filter(
      (stage) => stageRules(stage).countsAsActive
    );

    expect(active).toEqual(["inRotation"]);
  });
});

describe("deck stage vocabulary", () => {
  it("lists the three stages in roster order", () => {
    expect(DECK_STAGES).toEqual(["inRotation", "resting", "retired"]);
  });

  it("a deck starts in rotation, so an existing deck keeps counting as today", () => {
    expect(DEFAULT_DECK_STAGE).toBe("inRotation");
    expect(stageRules(DEFAULT_DECK_STAGE).commitsCopies).toBe(true);
    expect(stageRules(DEFAULT_DECK_STAGE).feedsPlan).toBe(true);
  });

  it.each(["inRotation", "resting", "retired"])(
    "recognises %s as a stage",
    (value) => {
      expect(isDeckStage(value)).toBe(true);
    }
  );

  it.each(["archived", "Retired", "", null, undefined, 2])(
    "refuses %p as a stage",
    (value) => {
      expect(isDeckStage(value)).toBe(false);
    }
  );
});
