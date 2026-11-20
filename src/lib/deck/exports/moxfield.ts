/**
 * The Moxfield deck export: `//` comment headings over "1 Card Name" lines.
 *
 * Deck interchange. Keeps every zone and the companion; the app's own text
 * importer reads it back (`fixtures/moxfield-v1.ts` pins the import side).
 *
 * @module deck/exports/moxfield
 */
import type { Deck } from "@/lib/deck/types";
import { cardLine } from "./card-line";
import { textDownload, type ExportResult } from "./contract";

/** Moxfield format — same as plain text, Moxfield parses "1 Card Name" directly */
export function exportMoxfield(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) {
    lines.push("// Commander", cardLine(deck.commander), "");
  }
  if (deck.partner) {
    lines.push("// Partner", cardLine(deck.partner), "");
  }
  if (deck.companion) {
    lines.push("// Companion", cardLine(deck.companion), "");
  }
  lines.push("// Deck");
  for (const zone of ["main", "sideboard", "maybeboard"]) {
    const zoneCards = deck.cards.filter((card) => card.zone === zone);
    if (zone !== "main" && zoneCards.length > 0) {
      lines.push("", zone === "sideboard" ? "// Sideboard" : "// Considering");
    }
    for (const card of zoneCards) lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/**
 * The Moxfield export as an {@link ExportResult}. It keeps every zone and the
 * companion, so it has no notice.
 */
export function moxfieldExport(deck: Deck): ExportResult {
  return {
    content: exportMoxfield(deck),
    ...textDownload(deck, "moxfield"),
    notices: [],
  };
}
