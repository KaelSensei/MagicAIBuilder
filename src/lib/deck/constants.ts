/**
 * Tuning constants of the deck analysis that more than one module may read.
 *
 * Deck analysis context. Today only `mana-alignment.ts` reads it.
 *
 * @module deck/constants
 */

/**
 * How many percentage points a colour's share of the mana sources may differ
 * from its share of the coloured pips before `mana-alignment.ts` flags that
 * colour as short ("under") or heavy ("over"). A gap of exactly 15 still
 * counts as aligned. Product choice, not a rule of the game.
 */
export const MANA_IMBALANCE_THRESHOLD = 15;
