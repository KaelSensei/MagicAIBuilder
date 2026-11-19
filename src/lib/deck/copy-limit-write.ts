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
  return { ...card, quantity: copiesWithinLimit(card.quantity, deckCopyLimit(card, deck)) };
}
