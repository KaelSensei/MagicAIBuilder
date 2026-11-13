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

/** How many replaced states `history` keeps; each of them keeps its own, so undo goes further. */
const UNDO_DEPTH = 10;

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

// ─── Transitions ──────────────────────────────────────────────────────────
/**
 * The evidence a transition attaches to its log line: what kind of move it was and its amounts,
 * plus the `turn` and `phase` the line belongs to when they differ from the state's (the line
 * that starts a turn is logged as of the new turn, `applyNextTurn`).
 */
export type ActionLogEvidence = Partial<
  Pick<
    PlaytestActionLogEntry,
    "kind" | "amount" | "lifeDelta" | "counterDelta" | "turn" | "phase"
  >
>;

/** What one transition hands to `pushHistory`: the patch it applies and the line it logs. */
export interface Transition {
  readonly patch: PlaytestEnginePatch;
  /**
   * The log line. A transition without one (an edit of the log itself) still gets its undo
   * entry; an empty string counts as no line.
   */
  readonly description?: string;
  readonly evidence?: ActionLogEvidence;
}

/**
 * Applies the transition's patch, logs its line when it has one, and pushes the replaced state
 * onto the undo stack, stamped by `clock`.
 *
 * `history` keeps the `UNDO_DEPTH` most recent snapshots, but each snapshot keeps its own
 * `history`, so undo can still walk back to the deal and every earlier state stays in memory
 * (pinned in `engine.characterization.test.ts`).
 *
 * A patch may already carry log lines of its own (the turn-1 draw a move takes on the way,
 * `takeFirstTurnDraw`); the new line follows them, and the whole move is one undo entry.
 */
export function pushHistory(
  state: PlaytestEngine,
  clock: Clock,
  transition: Transition
): PlaytestEngine {
  const historyEntry: UndoHistoryEntry = { timestamp: clock.now(), state };

  return {
    ...state,
    ...transition.patch,
    ...appendLogLine(state, transition),
    history: [historyEntry, ...state.history].slice(0, UNDO_DEPTH),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────
/**
 * The log and the next line id once the transition's line, if any, follows the lines its patch
 * already carries.
 */
function appendLogLine(
  state: PlaytestEngine,
  transition: Transition
): Pick<PlaytestEngine, "nextActionId"> &
  Partial<Pick<PlaytestEngine, "actionLog">> {
  const { patch, description } = transition;
  const priorLog = patch.actionLog ?? state.actionLog;
  const priorNextId = patch.nextActionId ?? state.nextActionId;
  if (!description) return { nextActionId: priorNextId };

  return {
    actionLog: [
      ...priorLog,
      logLine(state, priorNextId, { ...transition, description }),
    ],
    nextActionId: priorNextId + 1,
  };
}

/** One log line, stamped with the state's turn and step unless the evidence says otherwise. */
function logLine(
  state: PlaytestEngine,
  id: number,
  line: Transition & { readonly description: string }
): PlaytestActionLogEntry {
  const evidence = line.evidence ?? {};
  return {
    id,
    turn: evidence.turn ?? state.turn,
    phase: evidence.phase ?? state.phase,
    description: line.description,
    ...(evidence.kind ? { kind: evidence.kind } : {}),
    ...(evidence.amount ? { amount: evidence.amount } : {}),
    ...(evidence.lifeDelta !== undefined
      ? { lifeDelta: evidence.lifeDelta }
      : {}),
    ...(evidence.counterDelta !== undefined
      ? { counterDelta: evidence.counterDelta }
      : {}),
  };
}
