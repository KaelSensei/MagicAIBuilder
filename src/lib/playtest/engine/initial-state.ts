/**
 * The deal: the state a goldfish game starts from, with the library shuffled and seven drawn.
 *
 * Context: playtest, the engine. `store.ts` turns the deck rows into physical cards and
 * calls `createPlaytestState` with the session's own life total, table size and mulligan rule.
 * Rules: seven cards (CR 103.5), commanders dealt into the command zone (CR 903.6), the deal
 * waiting in the Draw step of turn 1 so the player can mulligan first (CR 103.5, 103.8).
 * Not responsible for: the shuffle (`shuffle.ts`), the mulligan (`mulligan.ts`) or turning
 * deck rows into cards (`store.ts`).
 *
 * @module playtest/engine/initial-state
 */

import type { DeckCard } from "@/lib/deck/types";
import { OPENING_HAND_SIZE, STARTING_LIFE } from "@/lib/deck/game-constants";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import { shuffleCards } from "./shuffle";
import type { PlaytestEngine } from "./types";

// ─── Initial State ────────────────────────────────────────────────────────
/**
 * Create a fresh playtest state: shuffle deck, draw 7 cards.
 *
 * `deckCards` holds one entry per physical library card. The commanders go in
 * `overrides.commandZone`, never in `deckCards`; they become `commanderIds`.
 *
 * @param deps - the random source for the shuffle; a full `PlaytestDeps` is accepted
 */
export function createPlaytestState(
  deckCards: readonly DeckCard[],
  overrides: Partial<PlaytestEngine> = {},
  deps: Pick<PlaytestDeps, "random"> = defaultPlaytestDeps
): PlaytestEngine {
  const shuffled = shuffleCards(deckCards, deps.random);

  const hand = shuffled.slice(0, OPENING_HAND_SIZE);
  const library = shuffled.slice(OPENING_HAND_SIZE);

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
    isGameOver: false,
    hand,
    library,
    battlefield: [],
    graveyard: [],
    exile: [],
    commandZone: [],
    // The cards dealt into the command zone are the game's commanders.
    commanderIds: (overrides.commandZone ?? []).map((card) => card.id),
    diceRolls: [],
    actionLog: [],
    nextActionId: 1,
    history: [],
    ...overrides,
  };
}
