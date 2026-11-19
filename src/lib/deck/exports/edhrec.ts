/**
 * The EDHREC deck-check export: a plain list, command zone first.
 *
 * Deck interchange.
 *
 * @module deck/exports/edhrec
 */
import type { Deck } from "@/lib/deck/types";
import { cardLine } from "./card-line";
import { textDownload, type ExportResult } from "./contract";
import { droppedCompanion, droppedZone } from "./notices";

/**
 * EDHRec format — the deck check tool takes a plain list with no marker
 * syntax and reads the first legal commander as the deck's commander, so the
 * command zone goes first.
 */
export function exportEdhrec(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) lines.push(cardLine(deck.commander));
  if (deck.partner) lines.push(cardLine(deck.partner));
  for (const card of deck.cards) {
    if (card.zone !== "main") continue;
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/**
 * The EDHREC export as an {@link ExportResult}. The deck check reads the main
 * deck only, so the companion, Sideboard and Considering cards each get a
 * `cardDropped` notice.
 */
export function edhrecExport(deck: Deck): ExportResult {
  return {
    content: exportEdhrec(deck),
    ...textDownload(deck, "edhrec"),
    notices: [
      ...droppedCompanion(deck),
      ...droppedZone(deck, "sideboard"),
      ...droppedZone(deck, "maybeboard"),
    ],
  };
}
