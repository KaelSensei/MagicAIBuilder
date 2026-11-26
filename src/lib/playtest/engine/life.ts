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

/**
 * The cause a loss of life records when the caller names none. It is an identifier the life
 * history keeps; the log line for it is worded by the player's locale (`lostLife`, #1853).
 */
const DEFAULT_DAMAGE_CAUSE = "damage";

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
 * True for an amount of life the rules cannot change by: below 0. CR 107.1b: "You can't choose
 * a negative number, deal negative damage, gain negative life, and so on." Zero is lawful: a
 * source that would deal 0 damage deals none (CR 120.8).
 *
 * Pure; the life transitions and the command guard table share it so they cannot disagree.
 */
export function isNegativeAmount(amount: number): boolean {
  return amount < 0;
}

/**
 * Takes `amount` off the life total (CR 119.3) and records the loss in the life history.
 *
 * Returns the same state while a bottom choice is pending, and for a negative `amount`: no
 * rule deals negative damage (CR 107.1b), so it must not become a life gain that skips
 * `applyHeal`. Damage of 0 is still recorded, as it always was.
 *
 * @param amount - the life lost; below 0 changes nothing
 * @param description - what caused the loss, kept in the history. The default cause logs a line
 * the player's locale words ("damage"); any other cause is the caller's words, shown as given.
 * @param deps - `clock` stamps the history entry and the undo entry
 */
export function applyDamage(
  state: PlaytestEngine,
  amount: number,
  description = DEFAULT_DAMAGE_CAUSE,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (isNegativeAmount(amount)) return state;
  const newLife = state.lifeTotal - amount;
  const entry = lifeEntry(state, deps.clock, { delta: -amount, description });

  return pushHistory(state, deps.clock, {
    patch: {
      lifeTotal: newLife,
      lifeHistory: [...state.lifeHistory, entry],
    },
    message:
      description === DEFAULT_DAMAGE_CAUSE
        ? { key: "lostLife", params: { amount } }
        : { key: "lostLifeTo", params: { amount, cause: description } },
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
    message: { key: "gainedLife", params: { amount } },
    evidence: { kind: "life", lifeDelta: amount },
  });
}
