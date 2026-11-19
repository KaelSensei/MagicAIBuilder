/**
 * The card count of a stored deck, read from its `DeckCard` rows rather than
 * from a loaded deck: the count the deck listings show before the deck is
 * opened.
 *
 * Deck-building context, pure: it counts exactly what `countDeckCards`
 * (`deck-size.ts`) counts once the store has read the command zone out of the
 * rows, so the deck list, the editor and the builder title bar agree on one
 * deck. A row's slot comes from `commandSlotOf`, the rule the store and the
 * server read the command zone by.
 *
 * @module deck/stored-card-count
 */
import { commandSlotOf, type CommandSlotFlags } from "./bulk-edit-command-zone";

/** One stored row, or a group of rows sharing these columns, with its copies. */
export interface StoredCardCopies extends CommandSlotFlags {
  /** `DeckCard.zone`: "main", "sideboard" or "maybeboard". */
  readonly zone: string;
  /** The copies the row holds, or the summed copies of the group. */
  readonly quantity: number;
}

/**
 * Counts the cards stored rows hold against the deck's size rule: every copy
 * in the main zone, plus one for the commander and one for the partner, as
 * `countDeckCards` counts a loaded deck. CR 903.5a: the commander counts
 * toward the 100; CR 702.124a: a partner is a second commander. The
 * sideboard, the maybeboard and a companion (CR 702.139a: not a commander)
 * stay out.
 *
 * A command slot counts once however many copies its row claims, as the store
 * keeps one card per slot.
 *
 * @param rows - the deck's stored rows, or groups of them; any order
 * @returns the card count the editor and the title bar show for the deck
 */
export function countStoredCardCopies(
  rows: readonly StoredCardCopies[]
): number {
  let mainCopies = 0;
  let hasCommander = false;
  let hasPartner = false;
  for (const row of rows) {
    const slot = commandSlotOf(row);
    if (slot === "commander") hasCommander = true;
    else if (slot === "partner") hasPartner = true;
    else if (slot === null && row.zone === "main") mainCopies += row.quantity;
  }
  return mainCopies + (hasCommander ? 1 : 0) + (hasPartner ? 1 : 0);
}
