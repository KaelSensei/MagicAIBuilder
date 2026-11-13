/**
 * Die rolls: the table-side record `DiceRoller.tsx` shows.
 *
 * Context: playtest, the engine. The store rolls the die (it owns the randomness of the UI)
 * and passes the result in, so the engine only validates and records it.
 * Rules: rolling a die (CR 706.1).
 *
 * @module playtest/engine/dice
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type { PlaytestEngine } from "./types";

// ─── Dice ────────────────────────────────────────────────────────────────
/**
 * Records a die roll (CR 706.1) and logs it; `diceRolls` keeps the ten most recent.
 *
 * Returns the same state while a bottom choice is pending, when `sides` is not an integer of
 * at least 2, or when `result` is not an integer in `[1, sides]`.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyRollDie(
  state: PlaytestEngine,
  sides: number,
  result: number,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (!Number.isInteger(sides) || sides < 2) return state;
  if (!Number.isInteger(result) || result < 1 || result > sides) return state;

  return pushHistory(
    state,
    deps.clock,
    {
      diceRolls: [...state.diceRolls, { sides, result }].slice(-10),
    },
    `Rolled d${sides}: ${result}`
  );
}
