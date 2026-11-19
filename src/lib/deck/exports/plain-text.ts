/**
 * The plain-text deck export: every zone under its own heading, with card
 * notes as `// Note:` comment lines.
 *
 * Deck interchange. The app's own text importer reads it back
 * (`parseTextDecklist`), so it keeps every zone and the companion.
 *
 * @module deck/exports/plain-text
 */
import type { Deck, DeckCard } from "@/lib/deck/types";
import { cardLine } from "./card-line";
import { textDownload, type ExportResult } from "./contract";

function plainTextCardLines(card: DeckCard): string[] {
  const lines = [cardLine(card, card.quantity)];
  const note = card.notes?.trim();
  if (note) {
    lines.push(...note.split(/\r\n|\r|\n/).map((line) => `// Note: ${line}`));
  }
  return lines;
}

/** Plain text export — simple "1 Card Name" format, with optional // note lines */
export function exportPlainText(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) {
    lines.push("Commander", cardLine(deck.commander), "");
  }
  if (deck.partner) {
    lines.push("Partner", cardLine(deck.partner), "");
  }
  if (deck.companion) {
    lines.push("Companion", cardLine(deck.companion), "");
  }
  lines.push("Deck");
  for (const [zone, heading] of [
    ["main", ""],
    ["sideboard", "Sideboard"],
    ["maybeboard", "Considering"],
  ] as const) {
    const zoneCards = deck.cards.filter((card) => card.zone === zone);
    if (zone !== "main" && zoneCards.length > 0) lines.push("", heading);
    for (const card of zoneCards) lines.push(...plainTextCardLines(card));
  }
  return lines.join("\n");
}

/**
 * The plain-text export as an {@link ExportResult}. It keeps every zone and
 * the companion, so it has no notice.
 */
export function plainTextExport(deck: Deck): ExportResult {
  return {
    content: exportPlainText(deck),
    ...textDownload(deck, "plaintext"),
    notices: [],
  };
}
