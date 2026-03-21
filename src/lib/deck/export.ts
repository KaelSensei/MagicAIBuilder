// Deck export utilities — supports Moxfield, Arena, MTGO, TappedOut, Archidekt, Plain Text
import type { Deck, DeckCard } from "./types";

/** Format a single card line for plain text / Moxfield */
function cardLine(card: DeckCard, qty = 1): string {
  return `${qty} ${card.name}`;
}

/** Plain text export — simple "1 Card Name" format, with optional // note lines */
export function exportPlainText(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) { lines.push("Commander", cardLine(deck.commander), ""); }
  if (deck.partner) { lines.push("Partner", cardLine(deck.partner), ""); }
  lines.push("Deck");
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
    const note = card.notes?.trim();
    if (note) lines.push(`// ${note}`);
  }
  return lines.join("\n");
}

/** Moxfield format — same as plain text, Moxfield parses "1 Card Name" directly */
export function exportMoxfield(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) { lines.push("// Commander", cardLine(deck.commander), ""); }
  if (deck.partner) { lines.push("// Partner", cardLine(deck.partner), ""); }
  lines.push("// Deck");
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/** MTG Arena format — requires "Commander" / "Deck" sections with set/number if available */
export function exportArena(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander || deck.partner) {
    lines.push("Commander");
    if (deck.commander) lines.push(cardLine(deck.commander));
    if (deck.partner) lines.push(cardLine(deck.partner));
    lines.push("");
  }
  lines.push("Deck");
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/** MTGO .dek format (XML) */
export function exportMTGO(deck: Deck): string {
  const allCards: { name: string; qty: number; isSideboard?: boolean }[] = [];
  if (deck.commander) allCards.push({ name: deck.commander.name, qty: 1 });
  if (deck.partner) allCards.push({ name: deck.partner.name, qty: 1 });
  for (const card of deck.cards) {
    allCards.push({ name: card.name, qty: card.quantity });
  }

  const cardXml = allCards
    .map((c) => `  <Cards CatID="0" Quantity="${c.qty}" Sideboard="false" Name="${c.name.replace(/"/g, "&quot;")}" />`)
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<Deck xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NetDeckID>0</NetDeckID>
  <PreconstructedDeckID>0</PreconstructedDeckID>
${cardXml}
</Deck>`;
}

/** TappedOut format — commanders marked with *CMDR* */
export function exportTappedOut(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) lines.push(`1x ${deck.commander.name} *CMDR*`);
  if (deck.partner) lines.push(`1x ${deck.partner.name} *CMDR*`);
  for (const card of deck.cards) {
    lines.push(`${card.quantity}x ${card.name}`);
  }
  return lines.join("\n");
}

/** Archidekt format — sections with card counts */
export function exportArchidekt(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander || deck.partner) {
    const cmdCount = (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0);
    lines.push(`Commander (${cmdCount})`);
    if (deck.commander) lines.push(cardLine(deck.commander));
    if (deck.partner) lines.push(cardLine(deck.partner));
    lines.push("");
  }
  const mainCount = deck.cards.reduce((s, c) => s + c.quantity, 0);
  lines.push(`Mainboard (${mainCount})`);
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Trigger a file download */
export function downloadFile(content: string, filename: string, mimeType = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
