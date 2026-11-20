import { describe, expect, it } from "vitest";

import { parseSheetResponse } from "./sheet-response";

const SHEET = {
  id: "sheet-1",
  deckId: "deck-1",
  speed: "core",
  winConditions: ["Combat damage"],
  combos: { present: false, note: "" },
  extraTurns: { present: false, note: "" },
  resourceDenial: { present: false, note: "" },
  proxyCount: 1,
  houseRules: "No mass land denial.",
  createdAt: "2026-11-20T12:00:00.000Z",
  updatedAt: "2026-11-20T12:00:00.000Z",
};

describe("parseSheetResponse", () => {
  it("reads a declared sheet and drops the deck list", () => {
    const parsed = parseSheetResponse({
      sheet: { ...SHEET, cards: ["Sol Ring"] },
    });

    expect(parsed).toEqual({
      kind: "sheet",
      id: "sheet-1",
      draft: {
        speed: "core",
        winConditions: ["Combat damage"],
        combos: { present: false, note: "" },
        extraTurns: { present: false, note: "" },
        resourceDenial: { present: false, note: "" },
        proxyCount: 1,
        houseRules: "No mass land denial.",
      },
    });
  });

  it("reads an owner who has not written a sheet", () => {
    expect(parseSheetResponse({ sheet: null })).toEqual({ kind: "empty" });
  });

  it("refuses a body that is not a sheet", () => {
    expect(parseSheetResponse({ cards: ["Sol Ring"] })).toEqual({
      kind: "invalid",
    });
    expect(parseSheetResponse({ sheet: { ...SHEET, speed: "fast" } })).toEqual({
      kind: "invalid",
    });
  });
});
