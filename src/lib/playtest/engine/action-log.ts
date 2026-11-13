/**
 * The editable action log: the notes the player adds, edits and removes by hand, and the mana
 * they record.
 *
 * Context: playtest, the engine. `PlaytestActionLog.tsx` calls these through the store. The
 * lines the other transitions write (draws, moves, life) are written by `pushHistory`
 * (`history.ts`) and only edited or removed here.
 * Not responsible for: the log's export (`action-log-export.ts`) or the evidence read from it
 * (`draw-progress-evidence.ts`).
 *
 * @module playtest/engine/action-log
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type { PlaytestEngine } from "./types";

// ─── Editable action log ─────────────────────────────────────────────────
/**
 * Adds a free-text note to the log, stamped with the current turn and step.
 *
 * The note is trimmed; an empty or blank note changes nothing. Returns the same state while a
 * bottom choice is pending.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyAddActionLogEntry(
  state: PlaytestEngine,
  description: string,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const normalized = description.trim();
  if (normalized === "") return state;
  return pushHistory(state, deps.clock, { patch: {}, description: normalized });
}

/**
 * Logs mana the player produced, as a `kind: "mana"` line with the amount as evidence.
 *
 * Accepts an integer `amount` in `[1, 100]`; anything else changes nothing. Returns the same
 * state while a bottom choice is pending.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyRecordMana(
  state: PlaytestEngine,
  amount: number,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) return state;
  return pushHistory(state, deps.clock, {
    patch: {},
    description: `Produced ${amount} mana`,
    evidence: { kind: "mana", amount },
  });
}

/**
 * Rewrites the text of one log line.
 *
 * The edited line loses its `kind` and amounts: once the player has changed what it says, it
 * no longer counts as a draw, mana, life or counter evidence. The edit is undoable but writes
 * no log line of its own. The text is trimmed; an empty text or an unknown `entryId` changes
 * nothing. Returns the same state while a bottom choice is pending.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyEditActionLogEntry(
  state: PlaytestEngine,
  entryId: number,
  description: string,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const normalized = description.trim();
  const exists = state.actionLog.some((entry) => entry.id === entryId);
  if (!exists || normalized === "") return state;
  return pushHistory(state, deps.clock, {
    patch: {
      actionLog: state.actionLog.map((entry) => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          description: normalized,
          kind: undefined,
          amount: undefined,
          lifeDelta: undefined,
          counterDelta: undefined,
        };
      }),
    },
  });
}

/**
 * Removes one log line. Undoable, but writes no log line of its own; an unknown `entryId`
 * changes nothing. Returns the same state while a bottom choice is pending.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyRemoveActionLogEntry(
  state: PlaytestEngine,
  entryId: number,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (!state.actionLog.some((entry) => entry.id === entryId)) return state;
  return pushHistory(state, deps.clock, {
    patch: {
      actionLog: state.actionLog.filter((entry) => entry.id !== entryId),
    },
  });
}
