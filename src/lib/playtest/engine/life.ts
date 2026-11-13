/**
 * The player's life total: damage taken, life gained, and the history the life tracker shows.
 *
 * Context: playtest, the engine. `LifeTracker.tsx` calls both transitions through the store
 * and reads `lifeHistory`; each change is also a `kind: "life"` log line.
 * Rules: life loss and gain adjust the total (CR 119.3); at zero or less the player has lost
 * (CR 704.5a), which the engine records as `isGameOver`.
 * Not responsible for: the starting total (`initial-state.ts`, `lib/deck/game-constants.ts`).
 *
 * @module playtest/engine/life
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type { LifeHistoryEntry, PlaytestEngine } from "./types";

// ─── Damage / heal ────────────────────────────────────────────────────────
/**
 * Takes `amount` off the life total (CR 119.3) and records the loss in the life history.
 *
 * `isGameOver` becomes true when the total ends at zero or less (CR 704.5a) and false when a
 * later loss leaves it above zero; `applyHeal` never touches the flag. Returns the same state
 * while a bottom choice is pending. `amount` is not validated: a negative amount gains life.
 *
 * @param description - what caused the loss, kept in the history and the log line
 * @param deps - `clock` stamps the history entry and the undo entry
 */
export function applyDamage(
  state: PlaytestEngine,
  amount: number,
  description = "damage",
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const newLife = state.lifeTotal - amount;
  const entry: LifeHistoryEntry = {
    turn: state.turn,
    phase: state.phase,
    timestamp: deps.clock.now(),
    delta: -amount,
    description,
  };
  const newHistory = [...state.lifeHistory, entry];

  return pushHistory(
    state,
    deps.clock,
    {
      lifeTotal: newLife,
      lifeHistory: newHistory,
      isGameOver: newLife <= 0,
    },
    `Lost ${amount} life: ${description}`,
    { kind: "life", lifeDelta: -amount }
  );
}

/**
 * Adds `amount` to the life total (CR 119.3) and records the gain in the life history.
 *
 * Does not clear `isGameOver`: a player who reached zero stays flagged after a heal (pinned in
 * `engine.characterization.test.ts`). Returns the same state while a bottom choice is pending.
 *
 * @param deps - `clock` stamps the history entry and the undo entry
 */
export function applyHeal(
  state: PlaytestEngine,
  amount: number,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const newLife = state.lifeTotal + amount;
  const entry: LifeHistoryEntry = {
    turn: state.turn,
    phase: state.phase,
    timestamp: deps.clock.now(),
    delta: amount,
    description: "heal",
  };
  const newHistory = [...state.lifeHistory, entry];

  return pushHistory(
    state,
    deps.clock,
    {
      lifeTotal: newLife,
      lifeHistory: newHistory,
    },
    `Gained ${amount} life`,
    { kind: "life", lifeDelta: amount }
  );
}
