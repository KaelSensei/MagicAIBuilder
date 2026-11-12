/**
 * Whether a playtest game's first mulligan is free, and whether the player is
 * asked how many players the game has.
 *
 * CR 103.5c: "In a multiplayer game and in any Brawl game, the first mulligan
 * a player takes doesn't count toward the number of cards that player will put
 * on the bottom of their library or the number of mulligans that player may
 * take." The format alone does not decide it: Commander and Oathbreaker are
 * usually played multiplayer, but a one-on-one game gets no free mulligan.
 * The same answer decides the first-turn draw (CR 103.8a, 103.8c) and Brawl's
 * starting life total (CR 903.12f).
 *
 * @module playtest/free-mulligan
 */

import { getFormatConfig, type DeckFormat } from "@/lib/deck/formats";

/**
 * Whether a game of this format is taken as multiplayer until the player says
 * otherwise: `FORMAT_CONFIG.firstMulliganFree` is the format's usual table.
 *
 * @param format - the deck's format
 * @returns true when the format is usually played multiplayer
 */
export function isMultiplayerByDefault(format: DeckFormat): boolean {
  return getFormatConfig(format).firstMulliganFree;
}

/**
 * Whether the player is asked if the game is multiplayer: for the formats
 * usually, but not always, played multiplayer. Brawl is asked too: its free
 * mulligan holds at any table, but a two-player game starts at 25 life instead
 * of 30 (CR 903.12f) and skips the turn-1 draw (CR 103.8a). The constructed
 * formats are duels.
 *
 * @param format - the deck's format
 * @returns true for the formats usually, but not always, played multiplayer
 */
export function offersMultiplayerChoice(format: DeckFormat): boolean {
  return isMultiplayerByDefault(format);
}

/**
 * Applies CR 103.5c to one game.
 *
 * @param format - the deck's format
 * @param multiplayer - whether the game has more than two players
 * @returns true when the first mulligan is free
 */
export function isFirstMulliganFree(
  format: DeckFormat,
  multiplayer: boolean
): boolean {
  return format === "brawl" || multiplayer;
}
