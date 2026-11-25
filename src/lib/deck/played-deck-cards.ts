/**
 * The cards of the deck you buy to play: the command zone and the main deck.
 *
 * One rule for every figure that describes that deck — its price, its shopping
 * list, its statistics — so two of them never disagree on the same deck.
 * Sideboard and Considering rows stay out: they are not part of the deck you
 * sit down with.
 *
 * @module deck/played-deck-cards
 */
import type { DeckCard } from "./types";

/**
 * What the rule reads of a main-deck row: its zone. A builder card has one,
 * and so does a deck API row, so the deck comparison prices a stored deck by
 * the same rule as the builder.
 */
export type PlayedDeckRow = Pick<DeckCard, "zone">;

/** The parts of a deck that decide which of its cards are played. */
export interface PlayedDeckSource<Card extends PlayedDeckRow = DeckCard> {
  readonly commander: Card | null;
  readonly partner: Card | null;
  readonly cards: readonly Card[];
}

/**
 * Lists the cards of the deck you play: the commander, then the partner, then
 * every main-deck row, in their order.
 *
 * CR 903.5a: a Commander deck counts its commander among its cards, so the
 * command zone belongs to the deck you buy. CR 100.4: a sideboard is held
 * outside the deck, and Considering is the builder's own shortlist, not a game
 * zone, so neither counts.
 *
 * @param deck - A deck, or the commander, partner and rows of one
 * @returns A new array of the same rows; the deck is not changed
 */
export function playedDeckCards<Card extends PlayedDeckRow>(
  deck: PlayedDeckSource<Card>
): readonly Card[] {
  const played: Card[] = [];
  if (deck.commander) played.push(deck.commander);
  if (deck.partner) played.push(deck.partner);
  for (const card of deck.cards) {
    if (card.zone === "main") played.push(card);
  }
  return played;
}
