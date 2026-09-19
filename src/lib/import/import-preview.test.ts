import { describe, expect, it } from "vitest";
import { buildImportPreview } from "./import-preview";
import type { UrlImportResult } from "./url-import";

const result: UrlImportResult = {
  name: "Atraxa list",
  source: "moxfield",
  cards: [
    { name: "Atraxa, Praetors' Voice", quantity: 1, isCommander: true, isPartner: false, zone: "main" },
    { name: "Sol Ring", quantity: 1, isCommander: false, isPartner: false, zone: "main" },
    { name: "Sol Ring", quantity: 1, isCommander: false, isPartner: false, zone: "main" },
    { name: "Command Tower", quantity: 1, isCommander: false, isPartner: false, zone: "sideboard" },
  ],
  ignored: ["Missing Card"],
};

describe("buildImportPreview", () => {
  it("summarizes commanders, zones, quantities and duplicate decisions", () => {
    expect(buildImportPreview(result)).toEqual({
      name: "Atraxa list",
      source: "moxfield",
      commanderNames: ["Atraxa, Praetors' Voice"],
      partnerNames: [],
      zoneCounts: { main: 3, sideboard: 1, maybeboard: 0 },
      totalQuantity: 4,
      duplicateNames: ["Sol Ring"],
      ignoredNames: ["Missing Card"],
    });
  });

  it("does not treat multiple copies as a duplicate decision", () => {
    const basicLand: UrlImportResult = {
      ...result,
      cards: [{ ...result.cards[1], quantity: 4 }],
      ignored: [],
    };
    expect(buildImportPreview(basicLand).duplicateNames).toEqual([]);
  });
});
