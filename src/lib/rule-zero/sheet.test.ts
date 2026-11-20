import { describe, expect, it } from "vitest";

import { parseSheetDraft } from "./sheet";

const DECLARED = {
  speed: "core",
  winConditions: ["Combat damage"],
  combos: { present: false, note: "" },
  extraTurns: { present: true, note: "Time Warp" },
  resourceDenial: { present: false, note: "" },
  proxyCount: 0,
  houseRules: "No mass land denial.",
};

describe("parseSheetDraft", () => {
  it("keeps a player's declared fields and nothing derived from a deck", () => {
    const parsed = parseSheetDraft({ ...DECLARED, cards: ["Sol Ring"] });

    expect(parsed).toEqual({ ok: true, draft: DECLARED });
  });

  it("refuses a speed that is not one of the six declared speeds", () => {
    expect(parseSheetDraft({ ...DECLARED, speed: "fast" })).toEqual({
      ok: false,
      problem: "speed",
    });
  });

  it("refuses a proxy count that is negative or not a whole number", () => {
    expect(parseSheetDraft({ ...DECLARED, proxyCount: -1 })).toEqual({
      ok: false,
      problem: "proxy-count",
    });
    expect(parseSheetDraft({ ...DECLARED, proxyCount: 1.5 })).toEqual({
      ok: false,
      problem: "proxy-count",
    });
  });

  it("refuses a presence that is not a yes or no with text", () => {
    expect(
      parseSheetDraft({ ...DECLARED, combos: { present: "yes", note: "" } })
    ).toEqual({
      ok: false,
      problem: "presence",
    });
  });

  it("refuses a win condition that is blank", () => {
    expect(parseSheetDraft({ ...DECLARED, winConditions: ["  "] })).toEqual({
      ok: false,
      problem: "win-conditions",
    });
  });

  it("does not let a later change to the input rewrite the draft", () => {
    const winConditions = ["Combat damage"];
    const parsed = parseSheetDraft({ ...DECLARED, winConditions });
    winConditions.push("Poison");

    expect(parsed).toEqual({ ok: true, draft: DECLARED });
  });
});
