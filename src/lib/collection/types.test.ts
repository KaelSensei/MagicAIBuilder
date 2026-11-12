import { describe, expect, it } from "vitest";
import { CARD_CONDITIONS } from "./types";

describe("CARD_CONDITIONS", () => {
  it("lists the five card conditions from best to worst, the order the add dialog offers them", () => {
    expect(CARD_CONDITIONS).toEqual(["NM", "LP", "MP", "HP", "DMG"]);
  });
});
