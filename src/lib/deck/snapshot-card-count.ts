/**
 * The card count of a saved snapshot, read from its stored card list.
 *
 * Deck-building context, pure. A snapshot counts its cards as the deck list,
 * the editor and the builder title bar count a deck (`countStoredCardCopies`),
 * so a 100-card deck with 30 Forests in one row reads 100 in its history.
 * Snapshots saved before that rule stored their row count in
 * `DeckSnapshot.cardCount`; reading the count from the card list gives old
 * and new snapshots the same number without a migration.
 *
 * @module deck/snapshot-card-count
 */
import { restoredDeckCards } from "./snapshot-restore";
import { countStoredCardCopies } from "./stored-card-count";

/** A stored snapshot, reduced to what its card count is read from. */
export interface CountableSnapshot {
  /** The `DeckSnapshot.cardList` JSON, read back by `restoredDeckCards`. */
  readonly cardList: unknown;
  /** The `DeckSnapshot.cardCount` column: copies since this rule, rows before it. */
  readonly cardCount: number;
}

/**
 * Counts the cards a snapshot holds, by the rule of `countStoredCardCopies`:
 * every main-zone copy, plus one for the commander and one for the partner;
 * the sideboard, Considering and the companion stay out.
 *
 * A card list `restoredDeckCards` cannot read keeps the stored number rather
 * than throwing, so one damaged snapshot never empties the history list.
 *
 * @param deckId - The deck that owns the snapshot; the reader stamps it on each row.
 * @param snapshot - The snapshot's stored card list and stored count.
 * @returns The snapshot's card count, or its stored `cardCount` when the list cannot be read.
 */
export function snapshotCardCopies(
  deckId: string,
  snapshot: CountableSnapshot
): number {
  try {
    return countStoredCardCopies(restoredDeckCards(deckId, snapshot.cardList));
  } catch {
    return snapshot.cardCount;
  }
}
