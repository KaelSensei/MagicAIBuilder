/**
 * Deck names: the longest name a deck may have.
 *
 * Deck-building context, pure domain rule. The limit is the rename's rule
 * (`deckNameSchema` in `lib/validation/deck.ts`, the builder's name field).
 *
 * @module deck/deck-name
 */

/** The longest deck name a rename accepts, in UTF-16 code units, as zod and `maxLength` count. */
export const DECK_NAME_MAX_LENGTH = 200;
