/**
 * The one order for the card lists a player reads: by name, then by id. A
 * list sorted this way reads the same whatever order the deck's rows arrive
 * in (I-77 1.5, I-03 slice 5). Not responsible for which cards go in a list.
 *
 * @module deck/card-name-order
 */

/** A card as a sorted list holds it: its name, and its row id to break a tie. */
export interface NamedCardRow {
  readonly name: string;
  readonly cardId: string;
}

/**
 * Orders two cards by name, then by id, in English collation.
 *
 * @param left - one card
 * @param right - another card
 * @returns a negative, zero or positive number, as `Array.prototype.sort` expects
 */
export function compareByNameThenId(
  left: NamedCardRow,
  right: NamedCardRow
): number {
  return (
    left.name.localeCompare(right.name, "en") ||
    left.cardId.localeCompare(right.cardId, "en")
  );
}
