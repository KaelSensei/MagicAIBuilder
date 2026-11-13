/**
 * Undo by snapshot: every transition goes through `pushHistory`, which applies its patch, logs
 * its line and stores the state it replaced; `applyUndo` restores that state.
 *
 * Context: playtest, the engine. Every other `engine/` module calls `pushHistory`; the undo
 * button in `components/playtest/` calls `applyUndo` through the store.
 * Not responsible for: the content of the log lines (each transition writes its own) or the
 * bottom-choice guard, which `applyUndo` deliberately skips: undo is one of the two moves
 * allowed while a mulligan waits for its bottom cards (CR 103.5; see `isChoosingBottom`).
 *
 * @module playtest/engine/history
 */

import type { Clock } from "./ports";
import type {
  PlaytestActionLogEntry,
  PlaytestEngine,
  PlaytestEnginePatch,
  UndoHistoryEntry,
} from "./types";

// ─── Undo ────────────────────────────────────────────────────────────────
/**
 * Restores the state the most recent transition replaced.
 *
 * Returns the same state when nothing has happened yet. Undo is not itself a transition: it
 * writes no log line and pushes nothing, so there is no redo. The restored state carries its
 * own `history`, so undo can be repeated back to the deal (see `pushHistory`).
 */
export function applyUndo(state: PlaytestEngine): PlaytestEngine {
  if (state.history.length === 0) return state;

  const [previous] = state.history;
  return previous.state;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
/**
 * Applies `updates`, logs `actionDescription` when given, and pushes the replaced state onto
 * the undo stack, stamped by `clock`.
 *
 * `history` keeps the ten most recent snapshots, but each snapshot keeps its own `history`, so
 * undo can still walk back to the deal and every earlier state stays in memory (pinned in
 * `engine.characterization.test.ts`).
 *
 * A patch may already carry log lines of its own (the turn-1 draw a move takes on the way,
 * `takeFirstTurnDraw`); the new line follows them, and the whole move is one undo entry.
 */
export function pushHistory(
  state: PlaytestEngine,
  clock: Clock,
  updates: PlaytestEnginePatch,
  actionDescription?: string,
  evidence?: Partial<
    Pick<
      PlaytestActionLogEntry,
      "kind" | "amount" | "lifeDelta" | "counterDelta" | "turn" | "phase"
    >
  >
): PlaytestEngine {
  const priorLog = updates.actionLog ?? state.actionLog;
  const priorNextId = updates.nextActionId ?? state.nextActionId;
  const actionLog = actionDescription
    ? [
        ...priorLog,
        {
          id: priorNextId,
          turn: evidence?.turn ?? state.turn,
          phase: evidence?.phase ?? state.phase,
          description: actionDescription,
          ...(evidence?.kind ? { kind: evidence.kind } : {}),
          ...(evidence?.amount ? { amount: evidence.amount } : {}),
          ...(evidence?.lifeDelta !== undefined
            ? { lifeDelta: evidence.lifeDelta }
            : {}),
          ...(evidence?.counterDelta !== undefined
            ? { counterDelta: evidence.counterDelta }
            : {}),
        },
      ]
    : updates.actionLog;
  const newState: PlaytestEngine = {
    ...state,
    ...updates,
    ...(actionLog ? { actionLog } : {}),
    nextActionId: actionDescription ? priorNextId + 1 : priorNextId,
  };

  const historyEntry: UndoHistoryEntry = { timestamp: clock.now(), state };
  const newHistory = [historyEntry, ...state.history].slice(0, 10);

  return {
    ...newState,
    history: newHistory,
  };
}
