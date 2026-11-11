/**
 * Numbers the game itself fixes before turn one: the opening hand size and the
 * Commander starting life total.
 *
 * Context: format rules (`docs/engineering/architecture.md` maps `src/lib/deck/formats.ts` and its
 * neighbours to `format-rules`). Deck analysis (`turn-one.ts`) and the playtest engine
 * (`lib/playtest/engine.ts`) both read these values; keeping them here means deck analysis no longer
 * imports the playtest engine. Per-format values (life total, free first mulligan) stay in
 * `FORMAT_CONFIG` (`formats.ts`).
 *
 * Rule numbers cite the Comprehensive Rules edition the app ships,
 * `src/lib/rules/data/MagicCompRules-20260807.txt`.
 *
 * @module deck/game-constants
 */

/**
 * Cards in an opening hand, and in the new hand every London mulligan draws.
 *
 * CR 103.5: each player draws "their starting hand size, which is normally seven"; a mulligan
 * "draws a new hand of cards equal to their starting hand size". CR 903.7 keeps seven for
 * Commander. Vanguard's hand modifier (CR 103.5a) is out of scope: the app builds no Vanguard decks.
 */
export const OPENING_HAND_SIZE = 7;

/**
 * Commander starting life total, the playtest's default when no format value is passed.
 *
 * CR 103.4c: "In a Commander game, each player's starting life total is 40" (also CR 903.7). The
 * base game starts at 20 (CR 103.4); the per-format totals, Brawl's and Oathbreaker's included,
 * live in `FORMAT_CONFIG.startingLife`, whose Commander entry carries the same 40.
 */
export const STARTING_LIFE = 40;
