/**
 * How many card rows of a deck the store holds, and the deck's `cardCount`
 * kept equal to them.
 *
 * `Deck.cardCount` has two sources. The listing (`GET /api/decks`) sends only
 * the command zone plus the server's row count, and `isDeckStub` compares that
 * count with the rows held to know whether the full deck is still to be
 * fetched. Once the rows are held, the count is derived from them, and every
 * edit of the rows must keep it so: a count left behind made the builder read a
 * deck a card lighter as "half loaded" and show "Loading deck…" for good.
 *
 * @module deck/loaded-card-count
 */
import type { Deck } from "./types";

/** The slots whose rows count toward the deck's row total. */
type CardRows = Pick<Deck, "cards" | "commander" | "partner" | "companion">;

/**
 * Counts the card rows held for a deck: the main list plus each occupied
 * command-zone slot, as the server counts them (`_count.cards`). Copies of a
 * row do not count: a row's quantity is not a second row.
 *
 * @param deck - the rows as the store holds them
 * @returns the number of rows held
 */
export function countLoadedCards(deck: CardRows): number {
  return (
    deck.cards.length +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0) +
    (deck.companion ? 1 : 0)
  );
}

/**
 * The deck with its `cardCount` set to the rows it holds. Call it on every
 * write that changes the rows of a loaded deck, whatever the slot: the card
 * list and the command zone alike.
 *
 * The deck's `version` is left as it is: the rows on screen change before
 * the server answers, and the version the store holds stays the one to send
 * until that answer brings the next one (`deck-write-queue.ts`).
 *
 * @param deck - a deck whose rows were just changed
 * @returns the same deck with the count in step with its rows
 */
export function withLoadedCardCount<D extends Deck>(deck: D): D {
  return { ...deck, cardCount: countLoadedCards(deck) };
}
