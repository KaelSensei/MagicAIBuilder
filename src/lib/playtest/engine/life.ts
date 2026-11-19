/**
 * The player's life total: damage taken, life gained, and the history the life tracker shows.
 *
 * Context: playtest, the engine. `LifeTracker.tsx` calls both transitions through the store
 * and reads `lifeHistory`; each change is also a `kind: "life"` log line.
 * Rules: life loss and gain adjust the total (CR 119.3); at zero or less the player has lost
 * (CR 704.5a). The loss is read from the total by `hasLostOnLife`, never stored, so a heal,
 * a later loss and an undo all agree with it.
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

// ─── Losing on life ───────────────────────────────────────────────────────
/**
 * True when the player has lost the game on life: CR 704.5a, "If a player has 0 or less life,
 * that player loses the game."
 *
 * Pure and derived from `lifeTotal` alone, so it cannot drift from the total the way a stored
 * flag did (B2-46: a heal above zero used to leave the player flagged as lost).
 */
export function hasLostOnLife(
  state: Pick<PlaytestEngine, "lifeTotal">
): boolean {
  return state.lifeTotal <= 0;
}

// ─── Damage / heal ────────────────────────────────────────────────────────
/**
 * Takes `amount` off the life total (CR 119.3) and records the loss in the life history.
 *
 * Returns the same state while a bottom choice is pending. `amount` is not validated: a
 * negative amount gains life.
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
    },
    description: `Lost ${amount} life: ${description}`,
    evidence: { kind: "life", lifeDelta: -amount },
  });
}

/**
 * Adds `amount` to the life total (CR 119.3) and records the gain in the life history.
 *
 * A heal that brings the total above zero ends a loss on life, since `hasLostOnLife` reads the
 * total (CR 704.5a). Returns the same state while a bottom choice is pending.
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
