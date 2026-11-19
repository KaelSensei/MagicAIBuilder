/**
 * The copy limit applied to a server write of deck rows: the same rule the
 * editor's store applies (`deckCopyLimit` and `copiesWithinLimit` of
 * `./multiples`), fed from the stored deck instead of the store's state.
 *
 * Why on the server too: the server owns business rules (backend authority),
 * so a request from any client must not store more copies than the deck's
 * format allows (CR 100.2a, CR 903.5b). The clamp is silent, as in the
 * editor: the write succeeds with `min(requested, limit)` copies.
 *
 * @module deck/copy-limit-write
 */
import { commanderNameExceptions } from "./color-identity";
import { isDeckFormat } from "./formats";
import {
  copiesWithinLimit,
  deckCopyLimit,
  type CopyLimitCard,
  type CopyLimitDeck,
} from "./multiples";

/** The stored deck facts the copy limit reads. */
export interface StoredCopyRuleDeck {
  /** `Deck.format` as stored; an unknown value reads as Commander, as `maxQuantity` does */
  readonly format: string;
  /** The names of the rows that fill the commander and partner slots */
  readonly commandZoneNames: readonly string[];
}

/**
 * The copy-limit facts of a stored deck: its format and the rulebreaker
 * exceptions its commander and partner grant (CR 903.5e). The companion and
 * the 99 grant none.
 *
 * @param deck - The stored format and the command zone's names
 * @returns The deck facts `deckCopyLimit` reads
 */
export function storedCopyLimitDeck(deck: StoredCopyRuleDeck): CopyLimitDeck {
  return {
    format: isDeckFormat(deck.format) ? deck.format : undefined,
    exceptions: commanderNameExceptions(deck.commandZoneNames),
  };
}

/** A row a write stores: its card text and the copies asked for. */
export interface CopiesWrite extends CopyLimitCard {
  readonly quantity: number;
}

/**
 * The row with its copies clamped to the deck's copy limit. Basic lands and
 * "any number" cards keep their copies; "up to N" cards stop at N.
 *
 * @param card - The row to store, with the copies asked for
 * @param deck - The deck's copy-limit facts, from {@link storedCopyLimitDeck}
 * @returns The same row, with `quantity` from 1 to the card's limit
 */
export function cardWithinCopyLimit<Card extends CopiesWrite>(
  card: Card,
  deck: CopyLimitDeck
): Card {
  return {
    ...card,
    quantity: copiesWithinLimit(card.quantity, deckCopyLimit(card, deck)),
  };
}

/**
 * One row's edit with its new copies, if it names any, clamped to the row's
 * copy limit. An edit that names no quantity keeps the stored copies, so it
 * passes unchanged.
 *
 * @param edit - The columns to write; `quantity` absent keeps the stored copies
 * @param card - The card text of the row the edit changes
 * @param deck - The deck's copy-limit facts, from {@link storedCopyLimitDeck}
 * @returns The same edit, with `quantity` from 1 to the card's limit when present
 */
export function editWithinCopyLimit<Edit extends { readonly quantity?: number }>(
  edit: Edit,
  card: CopyLimitCard,
  deck: CopyLimitDeck
): Edit {
  if (edit.quantity === undefined) return edit;
  return {
    ...edit,
    quantity: copiesWithinLimit(edit.quantity, deckCopyLimit(card, deck)),
  };
}

/** One row's new copies in a bulk edit. */
export interface CopiesChange {
  readonly cardId: string;
  readonly quantity: number;
}

/**
 * The bulk edit's new copies, each clamped to its row's copy limit.
 *
 * @param changes - The new copies, by row id
 * @param rows - The card text of the rows the changes name, by row id. A row
 *   missing here is not in the deck: its change passes unchanged, and the
 *   write refuses it as stale.
 * @param deck - The deck's copy-limit facts, from {@link storedCopyLimitDeck}
 * @returns The changes, in order, with clamped copies
 */
export function changesWithinCopyLimit(
  changes: readonly CopiesChange[],
  rows: ReadonlyMap<string, CopyLimitCard>,
  deck: CopyLimitDeck
): readonly CopiesChange[] {
  return changes.map((change) => {
    const card = rows.get(change.cardId);
    if (card === undefined) return change;
    return {
      ...change,
      quantity: copiesWithinLimit(change.quantity, deckCopyLimit(card, deck)),
    };
  });
}
