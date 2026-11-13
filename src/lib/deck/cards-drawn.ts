/**
 * Cards drawn: how many cards a player has drawn by a point of the game, the
 * "cards drawn" input of a draw-odds question.
 *
 * Deck analysis, I-97. The opening hand is seven cards (CR 103.5), and each
 * turn's draw step draws one more (CR 504.1). Only the first turn differs by
 * table: in a two-player game the starting player skips that draw (CR 103.8a);
 * in any other multiplayer game no player does (CR 103.8c). Two-Headed Giant
 * (CR 103.8b) is not a format the app builds. A turn here is the player's own
 * turn, counted as the starting player's, as the playtest plays it.
 * Not responsible for: mulligans, extra draws, or the chance itself
 * (`chanceOfAtLeast` in `draw-odds.ts`).
 *
 * @module deck/cards-drawn
 */

import { getFormatConfig, type DeckFormat } from "./formats";
import { OPENING_HAND_SIZE } from "./game-constants";

/**
 * The point of the game a draw-odds question looks at: the opening hand, or
 * the end of the draw step of the player's turn `turn`, counted from 1.
 */
export type DrawPoint =
  | { readonly kind: "opening-hand" }
  | { readonly kind: "turn"; readonly turn: number };

/**
 * How many players the game begins with: two, or more than two, which is a
 * multiplayer game (CR 800.1).
 */
export type TableSize = "two-player" | "multiplayer";

/**
 * Cards drawn by a point of the game, opening hand included.
 *
 * @example
 * cardsDrawnBy({ kind: "opening-hand" }, "multiplayer"); // → 7
 * cardsDrawnBy({ kind: "turn", turn: 3 }, "multiplayer"); // → 10 (CR 103.8c)
 * cardsDrawnBy({ kind: "turn", turn: 3 }, "two-player"); // → 9 (CR 103.8a)
 *
 * @param point - the opening hand, or a turn from 1; a turn below 1 or not a
 *   whole number gives a count `chanceOfAtLeast` rejects as not a card count
 * @param table - the table the game is played at
 * @returns the number of cards drawn
 */
export function cardsDrawnBy(point: DrawPoint, table: TableSize): number {
  switch (point.kind) {
    case "opening-hand":
      return OPENING_HAND_SIZE;
    case "turn":
      return OPENING_HAND_SIZE + drawStepsBy(point.turn, table);
  }
  const _exhaustive: never = point;
  return _exhaustive;
}

/**
 * Draw steps that have drawn a card by the end of a turn's draw step. At a
 * multiplayer table no player skips the turn-1 draw (CR 103.8c); at a
 * two-player table the starting player does (CR 103.8a).
 *
 * @param turn - the player's turn, from 1
 * @param table - the table the game is played at
 */
function drawStepsBy(turn: number, table: TableSize): number {
  return table === "multiplayer" ? turn : turn - 1;
}

/**
 * The table a deck's format is usually played at, when the player has not
 * said: multiplayer for the formats `FORMAT_CONFIG.firstMulliganFree` marks as
 * played multiplayer by default (Commander, Oathbreaker, Brawl), two-player for
 * the constructed duel formats. The playtest takes the same default
 * (`isMultiplayerByDefault` in `lib/playtest/free-mulligan.ts`).
 *
 * @param format - the deck's format
 * @returns the format's usual table
 */
export function usualTable(format: DeckFormat): TableSize {
  return getFormatConfig(format).firstMulliganFree
    ? "multiplayer"
    : "two-player";
}
