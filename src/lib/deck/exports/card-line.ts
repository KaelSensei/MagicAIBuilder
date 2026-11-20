/**
 * The "quantity name" card line that most text exports share.
 *
 * Deck interchange. Used by the plain-text, Moxfield, Arena, MTGGoldfish and
 * EDHREC exporters. Not responsible for per-target name rules (I-50 slice 2)
 * or printing codes, which no export writes yet.
 *
 * @module deck/exports/card-line
 */
import type { DeckCard } from "@/lib/deck/types";

/**
 * One card line, `"<qty> <name>"`, with the card's name as stored.
 *
 * @param card - the card to write; only its name is read
 * @param qty - the number of copies; 1 for a command-zone card
 * @returns the line, without a line ending
 */
export function cardLine(card: Pick<DeckCard, "name">, qty = 1): string {
  return `${qty} ${card.name}`;
}
