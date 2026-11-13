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
import { type Clock, defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type { LifeHistoryEntry, PlaytestEngine } from "./types";

// ─── Life history ─────────────────────────────────────────────────────────
/**
 * The life-history entry for one change of the life total (CR 119.3): `delta` is negative for
 * a loss and positive for a gain, stamped with the turn and step it happened in and the time
 * `clock` reads now.
 *
 * Pure: the entry is returned, not recorded; `applyDamage` and `applyHeal` append it.
 */
export function lifeEntry(
  state: Pick<PlaytestEngine, "turn" | "phase">,
  clock: Clock,
  change: Pick<LifeHistoryEntry, "delta" | "description">
): LifeHistoryEntry {
  return {
    turn: state.turn,
    phase: state.phase,
    timestamp: clock.now(),
    delta: change.delta,
    description: change.description,
  };
}

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
  const entry = lifeEntry(state, deps.clock, { delta: -amount, description });

  return pushHistory(state, deps.clock, {
    patch: {
      lifeTotal: newLife,
      lifeHistory: [...state.lifeHistory, entry],
      isGameOver: newLife <= 0,
    },
    description: `Lost ${amount} life: ${description}`,
    evidence: { kind: "life", lifeDelta: -amount },
  });
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
  const entry = lifeEntry(state, deps.clock, {
    delta: amount,
    description: "heal",
  });

  return pushHistory(state, deps.clock, {
    patch: {
      lifeTotal: state.lifeTotal + amount,
      lifeHistory: [...state.lifeHistory, entry],
    },
    description: `Gained ${amount} life`,
    evidence: { kind: "life", lifeDelta: amount },
  });
}
