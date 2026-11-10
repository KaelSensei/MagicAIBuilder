/**
 * Whether a playtest game's first mulligan is free.
 *
 * CR 103.5c: "In a multiplayer game and in any Brawl game, the first mulligan
 * a player takes doesn't count toward the number of cards that player will put
 * on the bottom of their library or the number of mulligans that player may
 * take." The format alone does not decide it: Commander and Oathbreaker are
 * usually played multiplayer, but a one-on-one game gets no free mulligan.
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
 * Whether the player is asked if the game is multiplayer. Brawl needs no
 * answer, since every Brawl game has the free mulligan; the constructed
 * formats are duels.
 *
 * @param format - the deck's format
 * @returns true for the formats usually, but not always, played multiplayer
 */
export function offersMultiplayerChoice(format: DeckFormat): boolean {
  return format !== "brawl" && isMultiplayerByDefault(format);
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
