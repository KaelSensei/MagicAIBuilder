import { describe, expect, it } from "vitest";
import { buildImportPreview } from "./import-preview";
import type { UrlImportResult } from "./url-import";
import type { ScryfallCard } from "@/lib/scryfall/types";

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

const foundCards: ScryfallCard[] = [
  { id: "atraxa", name: "Atraxa, Praetors' Voice", cmc: 4, type_line: "Legendary Creature", color_identity: ["W", "U", "B", "G"] },
  { id: "sol-ring", name: "Sol Ring", cmc: 1, type_line: "Artifact", color_identity: [] },
  { id: "command-tower", name: "Command Tower", cmc: 0, type_line: "Land", color_identity: [] },
];

describe("buildImportPreview", () => {
  it("summarizes commanders, zones, quantities and duplicate decisions", () => {
    expect(buildImportPreview(result, foundCards)).toEqual({
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
    expect(buildImportPreview(basicLand, foundCards).duplicateNames).toEqual([]);
  });

  it("warns when repeated card lines differ only in case or spacing", () => {
    const imported: UrlImportResult = {
      ...result,
      cards: [
        { ...result.cards[1], name: "Sol Ring" },
        { ...result.cards[1], name: "sol  ring", zone: "sideboard" },
      ],
    };

    expect(buildImportPreview(imported, foundCards).duplicateNames).toEqual(["Sol Ring"]);
  });

  it("warns before confirmation about unresolved names without duplicating ignored cards", () => {
    const imported: UrlImportResult = {
      ...result,
      cards: [
        { name: "Fire", quantity: 1, isCommander: false, isPartner: false, zone: "main" },
        { name: "Unknown Spell", quantity: 1, isCommander: false, isPartner: false, zone: "main" },
        { name: "Unknown Spell", quantity: 1, isCommander: false, isPartner: false, zone: "sideboard" },
        { name: "Missing Card", quantity: 1, isCommander: false, isPartner: false, zone: "main" },
      ],
    };
    const foundCards: ScryfallCard[] = [{
      id: "fire-ice", name: "Fire // Ice", cmc: 2, type_line: "Instant", color_identity: ["R", "U"],
    }];

    expect(buildImportPreview(imported, foundCards).ignoredNames).toEqual([
      "Missing Card", "Unknown Spell",
    ]);
  });
});
