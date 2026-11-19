/**
 * The MTG Arena deck export: `Companion`, `Commander`, `Deck` and
 * `Sideboard` sections.
 *
 * Deck interchange. Arena set codes and collector numbers, availability and
 * Brawl legality are I-50 slice 3; this export writes names only.
 *
 * @module deck/exports/arena
 */
import type { Deck } from "@/lib/deck/types";
import { cardLine } from "./card-line";
import { textDownload, type ExportResult } from "./contract";
import { droppedZone } from "./notices";

/** MTG Arena format — requires "Commander" / "Deck" sections with set/number if available */
export function exportArena(deck: Deck): string {
  const lines: string[] = [];
  if (deck.companion) {
    lines.push("Companion", cardLine(deck.companion), "");
  }
  if (deck.commander || deck.partner) {
    lines.push("Commander");
    if (deck.commander) lines.push(cardLine(deck.commander));
    if (deck.partner) lines.push(cardLine(deck.partner));
    lines.push("");
  }
  lines.push("Deck");
  for (const card of deck.cards.filter((card) => card.zone === "main")) {
    lines.push(cardLine(card, card.quantity));
  }
  const sideboard = deck.cards.filter((card) => card.zone === "sideboard");
  const companion = deck.companion;
  if (companion && !sideboard.some((card) => card.name === companion.name)) {
    sideboard.push({ ...companion, quantity: 1, zone: "sideboard" });
  }
  if (sideboard.length > 0) {
    lines.push("", "Sideboard");
    for (const card of sideboard) lines.push(cardLine(card, card.quantity));
  }
  return lines.join("\n");
}

/**
 * The MTG Arena export as an {@link ExportResult}: the Considering cards it
 * leaves out each get a `cardDropped` notice. The companion keeps its
 * `Companion` section; its sideboard copy is how Arena expects it.
 */
export function arenaExport(deck: Deck): ExportResult {
  return {
    content: exportArena(deck),
    ...textDownload(deck, "arena"),
    notices: droppedZone(deck, "maybeboard"),
  };
}
