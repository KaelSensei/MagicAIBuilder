/**
 * The deal: the state a goldfish game starts from, with the library shuffled and seven drawn.
 *
 * Context: playtest, the engine. `deal.ts` turns the deck rows into physical cards and
 * calls `createPlaytestState` with the session's own life total, table size, mulligan rule and
 * any cards chosen for the opening hand.
 * Rules: seven cards (CR 103.5), commanders dealt into the command zone (CR 903.6), the deal
 * waiting in the Draw step of turn 1 so the player can mulligan first (CR 103.5, 103.8). A
 * new-card trial puts chosen cards in the hand before the draw; that is a practice aid, not a
 * rule, and only the first hand is chosen: a mulligan shuffles it all back (`mulligan.ts`).
 * Not responsible for: the shuffle (`shuffle.ts`), the mulligan (`mulligan.ts`) or turning
 * deck rows into cards, or which cards a player may choose (`deal.ts`).
 *
 * @module playtest/engine/initial-state
 */

import type { DeckCard } from "@/lib/deck/types";
import { OPENING_HAND_SIZE, STARTING_LIFE } from "@/lib/deck/game-constants";
import { NO_DESIGNATIONS } from "./designations";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import { shuffleCards } from "./shuffle";
import type { PlaytestActionLogEntry, PlaytestEngine } from "./types";

// ─── Initial State ────────────────────────────────────────────────────────
/**
 * The deal's settings: the session's own engine values, plus the cards a new-card trial
 * starts in the opening hand.
 */
export type DealSettings = Partial<PlaytestEngine> & {
  /**
   * Physical copies dealt into the opening hand before the draw, in order; never also in
   * `deckCards`. At most `OPENING_HAND_SIZE`: the hand is filled up to seven from the shuffle.
   */
  readonly chosenHand?: readonly DeckCard[];
};

/**
 * Create a fresh playtest state: shuffle deck, draw 7 cards.
 *
 * `deckCards` holds one entry per physical library card. The commanders go in
 * `overrides.commandZone`, never in `deckCards`; they become `commanderIds`. Chosen cards
 * (`overrides.chosenHand`) start in the hand and the shuffle draws the rest of the seven, so
 * with no chosen card the random source is asked exactly as for any deal. The deal then writes
 * the game's first log line, naming the chosen cards.
 *
 * @param deps - the random source for the shuffle; a full `PlaytestDeps` is accepted
 */
export function createPlaytestState(
  deckCards: readonly DeckCard[],
  overrides: DealSettings = {},
  deps: Pick<PlaytestDeps, "random"> = defaultPlaytestDeps
): PlaytestEngine {
  const { chosenHand = [], ...engineOverrides } = overrides;
  const shuffled = shuffleCards(deckCards, deps.random);
  const drawn = Math.max(0, OPENING_HAND_SIZE - chosenHand.length);

  const hand = [...chosenHand, ...shuffled.slice(0, drawn)];
  const library = shuffled.slice(drawn);
  const actionLog = chosenHandLog(chosenHand);

  return {
    turn: 1,
    // The game waits in the Draw step of turn 1 while the player mulligans; the turn-1 draw,
    // when the table owes one, is taken on leaving that step (`takeFirstTurnDraw`).
    phase: "Draw" as const,
    // Commander defaults, like STARTING_LIFE: a multiplayer table, so a free first mulligan.
    // The store passes the session's own values (`free-mulligan.ts`, FORMAT_CONFIG).
    multiplayer: true,
    mulliganCount: 0,
    firstMulliganFree: true,
    cardsToBottom: 0,
    lifeTotal: overrides.lifeTotal ?? STARTING_LIFE,
    lifeHistory: [],
    hand,
    library,
    battlefield: [],
    graveyard: [],
    exile: [],
    commandZone: [],
    // The cards dealt into the command zone are the game's commanders.
    commanderIds: (overrides.commandZone ?? []).map((card) => card.id),
    // No tally unless the deal says the format uses commander damage (`deal.ts`).
    commanderDamageOpponents: 0,
    commanderDamage: [],
    designations: NO_DESIGNATIONS,
    diceRolls: [],
    actionLog,
    nextActionId: actionLog.length + 1,
    history: [],
    ...engineOverrides,
  };
}

/**
 * The log line that opens a new-card trial, so its record says the hand was not a random deal;
 * none when no card was chosen. Written as of the deal (turn 1, Draw step), and not undoable:
 * the deal itself is not a transition.
 */
function chosenHandLog(
  chosenHand: readonly DeckCard[]
): readonly PlaytestActionLogEntry[] {
  if (chosenHand.length === 0) return [];
  const names = chosenHand.map((card) => card.name).join(", ");
  return [
    {
      id: 1,
      turn: 1,
      phase: "Draw",
      description: `Started with chosen cards: ${names}`,
    },
  ];
}
