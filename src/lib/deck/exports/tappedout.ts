/**
 * The TappedOut deck export: commanders marked `*CMDR*`, then the main deck.
 *
 * Deck interchange. No source confirms a sideboard or Considering syntax for
 * TappedOut's paste box (searched 2026-11-19), so those cards are left out.
 *
 * @module deck/exports/tappedout
 */
import type { Deck } from "@/lib/deck/types";
import { textDownload, type ExportResult } from "./contract";
import { droppedCompanion, droppedZone } from "./notices";

/**
 * TappedOut format — commanders marked with *CMDR*, then the main deck only.
 * No source confirms a sideboard or Considering syntax for TappedOut's paste
 * box (searched 2026-11-19), so those cards stay out of its main list.
 */
export function exportTappedOut(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) lines.push(`1x ${deck.commander.name} *CMDR*`);
  if (deck.partner) lines.push(`1x ${deck.partner.name} *CMDR*`);
  for (const card of deck.cards) {
    if (card.zone !== "main") continue;
    lines.push(`${card.quantity}x ${card.name}`);
  }
  return lines.join("\n");
}

/**
 * The TappedOut export as an {@link ExportResult}: the companion, Sideboard
 * and Considering cards it leaves out each get a `cardDropped` notice.
 */
export function tappedOutExport(deck: Deck): ExportResult {
  return {
    content: exportTappedOut(deck),
    ...textDownload(deck, "tappedout"),
    notices: [
      ...droppedCompanion(deck),
      ...droppedZone(deck, "sideboard"),
      ...droppedZone(deck, "maybeboard"),
    ],
  };
}
