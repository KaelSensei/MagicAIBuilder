/**
 * The printable decklist registration sheet (I-50, thirteenth-pass scope
 * line): blanks to fill by hand, the command zone apart, the main deck
 * alphabetical with counts, a sideboard only where the format allows one, and
 * the export contract's notices and determinism (requirement 1).
 */
import { describe, expect, it } from "vitest";
import { registrationSheetExport } from "@/lib/deck/export";
import type { Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import {
  ENGLISH_REGISTRATION_LABELS,
  REGISTRATION_SHEET_V1,
} from "./exports/fixtures/registration-sheet-v1";

/** Each card list of a printed sheet: its heading, then its line texts. */
function printedSections(html: string): Map<string, string[]> {
  const page = new DOMParser().parseFromString(html, "text/html");
  return new Map(
    [...page.querySelectorAll("section")].map((section) => [
      section.querySelector("h2")?.textContent ?? "",
      [...section.querySelectorAll("li, .total")].map(
        (line) => line.textContent ?? ""
      ),
    ])
  );
}

function printSheet(deck: Deck) {
  return registrationSheetExport(deck, ENGLISH_REGISTRATION_LABELS);
}

const MODERN_DECK: Deck = aDeck({
  name: "Burn",
  format: "modern",
  cards: [
    aDeckCard({ id: "m1", name: "Lightning Bolt", quantity: 4 }),
    aDeckCard({ id: "m2", name: "Goblin Guide", quantity: 4 }),
    aDeckCard({
      id: "s1",
      name: "Smash to Smithereens",
      quantity: 3,
      zone: "sideboard",
    }),
    aDeckCard({
      id: "s2",
      name: "Deflecting Palm",
      quantity: 2,
      zone: "sideboard",
    }),
  ],
});

describe("registration sheet export", () => {
  it("prints a Commander deck's two commanders apart and its main deck alphabetically, with no sideboard", () => {
    const { input, labels, expected } = REGISTRATION_SHEET_V1;

    expect(registrationSheetExport(input, labels)).toEqual(expected);
  });

  it("prints a Modern deck's sideboard, alphabetically with its total", () => {
    const sections = printedSections(printSheet(MODERN_DECK).content);

    expect(sections.get("Sideboard")).toEqual([
      "2 Deflecting Palm",
      "3 Smash to Smithereens",
      "Total: 5",
    ]);
    expect(printSheet(MODERN_DECK).notices).toEqual([]);
  });

  it("gives a cardDropped notice for a Considering card and never prints it", () => {
    const deck = aDeck({
      format: "modern",
      cards: [
        aDeckCard({ id: "m1", name: "Lightning Bolt", quantity: 4 }),
        aDeckCard({
          id: "c1",
          name: "Skewer the Critics",
          quantity: 2,
          zone: "maybeboard",
        }),
      ],
    });

    const sheet = printSheet(deck);

    expect(sheet.notices).toEqual([
      {
        kind: "cardDropped",
        cardName: "Skewer the Critics",
        quantity: 2,
        from: "maybeboard",
      },
    ]);
    expect(sheet.content).not.toContain("Skewer the Critics");
  });

  it("escapes an & in a card name, so it prints as typed", () => {
    const deck = aDeck({
      cards: [aDeckCard({ id: "c1", name: "Minsc & Boo, Timeless Heroes" })],
    });

    const sheet = printSheet(deck).content;

    expect(sheet).toContain("<li>1 Minsc &amp; Boo, Timeless Heroes</li>");
    expect(printedSections(sheet).get("Main deck")).toContain(
      "1 Minsc & Boo, Timeless Heroes"
    );
  });

  it("gives byte-identical output for two exports of the same deck", () => {
    const { input, labels } = REGISTRATION_SHEET_V1;

    expect(registrationSheetExport(input, labels).content).toBe(
      registrationSheetExport(input, labels).content
    );
  });
});
