/**
 * The Archidekt deck export: counted sections, each card tagged with its
 * category in Archidekt's bracket syntax.
 *
 * Deck interchange. Keeps the Sideboard and Considering zones as their own
 * sections.
 *
 * @module deck/exports/archidekt
 */
import type { Deck, DeckCard } from "@/lib/deck/types";
import { textDownload, type ExportResult } from "./contract";
import { droppedCompanion } from "./notices";

/** @returns the app category as an Archidekt bracket tag, e.g. `[Ramp]` */
function archidektCategoryTag(category: string): string {
  return `[${category.charAt(0).toUpperCase()}${category.slice(1)}]`;
}

/**
 * Appends a counted Archidekt section without emitting an empty zone.
 * @param lines Export lines being built.
 * @param heading Archidekt section heading.
 * @param cards Cards belonging to the section.
 * @returns Nothing.
 */
function appendArchidektSection(
  lines: string[],
  heading: string,
  cards: readonly DeckCard[]
): void {
  if (cards.length === 0) return;
  const count = cards.reduce((sum, card) => sum + card.quantity, 0);
  lines.push("", `${heading} (${count})`);
  for (const card of cards) {
    lines.push(
      `${card.quantity}x ${card.name} ${archidektCategoryTag(card.category)}`
    );
  }
}

/**
 * Archidekt format — sections with card counts, each card tagged with its
 * category in Archidekt's bracket syntax so the categorisation survives the
 * round trip. `{top}` pins the commander's category as premier, which is what
 * makes Archidekt display the card in the command zone.
 */
export function exportArchidekt(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander || deck.partner) {
    const cmdCount = (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0);
    lines.push(`Commander (${cmdCount})`);
    if (deck.commander)
      lines.push(`1x ${deck.commander.name} [Commander{top}]`);
    if (deck.partner) lines.push(`1x ${deck.partner.name} [Commander{top}]`);
    lines.push("");
  }
  const mainCards = deck.cards.filter((card) => card.zone === "main");
  const mainCount = mainCards.reduce((s, c) => s + c.quantity, 0);
  lines.push(`Mainboard (${mainCount})`);
  for (const card of mainCards) {
    lines.push(
      `${card.quantity}x ${card.name} ${archidektCategoryTag(card.category)}`
    );
  }
  appendArchidektSection(
    lines,
    "Sideboard",
    deck.cards.filter((card) => card.zone === "sideboard")
  );
  appendArchidektSection(
    lines,
    "Considering",
    deck.cards.filter((card) => card.zone === "maybeboard")
  );
  return lines.join("\n");
}

/**
 * The Archidekt export as an {@link ExportResult}. It has no companion
 * section, so the companion gets a `cardDropped` notice; Sideboard and
 * Considering keep their own sections.
 */
export function archidektExport(deck: Deck): ExportResult {
  return {
    content: exportArchidekt(deck),
    ...textDownload(deck, "archidekt"),
    notices: droppedCompanion(deck),
  };
}
