// Deck export utilities
import type { Deck } from "./types";
import { exportToText } from "./import";

/** Export deck to plain text format */
export function exportDeckToText(deck: Deck): string {
  return exportToText(deck.commander, deck.partner, deck.cards);
}

/** Generate Moxfield-compatible URL (opens import dialog) */
export function getMoxfieldImportUrl(): string {
  return "https://www.moxfield.com/decks/new";
}

/** Generate Archidekt-compatible URL */
export function getArchidektImportUrl(): string {
  return "https://archidekt.com/decks/new";
}

/** Copy deck text to clipboard */
export async function copyDeckToClipboard(deck: Deck): Promise<void> {
  const text = exportDeckToText(deck);
  await navigator.clipboard.writeText(text);
}
