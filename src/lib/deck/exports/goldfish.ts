/**
 * The MTGGoldfish deck export: the main deck, a blank line, then the
 * command zone in the sideboard slot.
 *
 * Deck interchange.
 *
 * @module deck/exports/goldfish
 */
import type { Deck } from "@/lib/deck/types";
import { cardLine } from "./card-line";

/**
 * MTGGoldfish format — their text import uses the MTGO convention: the main
 * deck, a blank line, then the commander (and partner) as the sideboard slot,
 * which Goldfish reads as the command zone for EDH decks.
 */
export function exportGoldfish(deck: Deck): string {
  const main = deck.cards
    .filter((card) => card.zone === "main")
    .map((card) => cardLine(card, card.quantity));
  const side: string[] = [];
  if (deck.commander) side.push(cardLine(deck.commander));
  if (deck.partner) side.push(cardLine(deck.partner));
  return side.length > 0
    ? `${main.join("\n")}\n\n${side.join("\n")}`
    : main.join("\n");
}
