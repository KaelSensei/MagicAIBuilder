// Deck export utilities — supports Moxfield, Arena, MTGO, TappedOut, Archidekt, Manabox, Plain Text
import type { Deck, DeckCard } from "./types";

/** Format a single card line for plain text / Moxfield */
function cardLine(card: DeckCard, qty = 1): string {
  return `${qty} ${card.name}`;
}

/** Plain text export — simple "1 Card Name" format */
export function exportPlainText(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) {
    lines.push("Commander");
    lines.push(cardLine(deck.commander));
    lines.push("");
  }
  if (deck.partner) {
    lines.push("Partner");
    lines.push(cardLine(deck.partner));
    lines.push("");
  }
  if (deck.companion) {
    lines.push("Companion");
    lines.push(cardLine(deck.companion));
    lines.push("");
  }
  lines.push("Deck");
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/** Moxfield format — same as plain text, Moxfield parses "1 Card Name" directly */
export function exportMoxfield(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) {
    lines.push("// Commander");
    lines.push(cardLine(deck.commander));
    lines.push("");
  }
  if (deck.partner) {
    lines.push("// Partner");
    lines.push(cardLine(deck.partner));
    lines.push("");
  }
  if (deck.companion) {
    lines.push("// Companion");
    lines.push(cardLine(deck.companion));
    lines.push("");
  }
  lines.push("// Deck");
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/** MTG Arena format — requires "Commander" / "Companion" / "Deck" sections with set/number if available */
export function exportArena(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander || deck.partner) {
    lines.push("Commander");
    if (deck.commander) lines.push(cardLine(deck.commander));
    if (deck.partner) lines.push(cardLine(deck.partner));
    lines.push("");
  }
  if (deck.companion) {
    lines.push("Companion");
    lines.push(cardLine(deck.companion));
    lines.push("");
  }
  lines.push("Deck");
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/** MTGO .dek format (XML) — companion goes in the sideboard */
export function exportMTGO(deck: Deck): string {
  const mainCards: { name: string; qty: number }[] = [];
  const sideboardCards: { name: string; qty: number }[] = [];

  if (deck.commander) mainCards.push({ name: deck.commander.name, qty: 1 });
  if (deck.partner) mainCards.push({ name: deck.partner.name, qty: 1 });
  for (const card of deck.cards) {
    mainCards.push({ name: card.name, qty: card.quantity });
  }
  if (deck.companion) sideboardCards.push({ name: deck.companion.name, qty: 1 });

  const mainXml = mainCards
    .map((c) => `  <Cards CatID="0" Quantity="${c.qty}" Sideboard="false" Name="${c.name.replace(/"/g, "&quot;")}" />`)
    .join("\n");

  const sideXml = sideboardCards
    .map((c) => `  <Cards CatID="0" Quantity="${c.qty}" Sideboard="true" Name="${c.name.replace(/"/g, "&quot;")}" />`)
    .join("\n");

  const cardXml = [mainXml, sideXml].filter(Boolean).join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<Deck xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NetDeckID>0</NetDeckID>
  <PreconstructedDeckID>0</PreconstructedDeckID>
${cardXml}
</Deck>`;
}

/** TappedOut format — commanders marked with *CMDR*, companion with *SB* (sideboard) */
export function exportTappedOut(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) lines.push(`1x ${deck.commander.name} *CMDR*`);
  if (deck.partner) lines.push(`1x ${deck.partner.name} *CMDR*`);
  if (deck.companion) lines.push(`1x ${deck.companion.name} *SB*`);
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
  if (deck.companion) {
    lines.push("Companion (1)");
    lines.push(cardLine(deck.companion));
    lines.push("");
  }
  const mainCount = deck.cards.reduce((s, c) => s + c.quantity, 0);
  lines.push(`Mainboard (${mainCount})`);
  for (const card of deck.cards) {
    lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/**
 * Manabox format — same card-per-line format as MTG Arena, with optional set codes.
 * Manabox also accepts "1 Card Name" lines and "Commander" / "Companion" / "Deck" sections.
 */
export function exportManabox(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander || deck.partner) {
    lines.push("Commander");
    if (deck.commander) lines.push(cardLine(deck.commander));
    if (deck.partner) lines.push(cardLine(deck.partner));
    lines.push("");
  }
  if (deck.companion) {
    lines.push("Companion");
    lines.push(cardLine(deck.companion));
    lines.push("");
  }
  lines.push("Deck");
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
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
