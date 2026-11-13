/**
 * The turn: drawing a card, stepping through the phases and starting the next turn.
 *
 * Context: playtest, the engine. The phase tracker and the draw button in
 * `components/playtest/` call these through the store. The turn-1 draw a multiplayer game
 * owes is taken here, by whichever move first leaves the Draw step of turn 1.
 * Rules: drawing (CR 121.1), the draw step (CR 504.1), the untap step (CR 502.3), the
 * first-turn draw (CR 103.8a, 103.8c) and the mulligans that come before it (CR 103.5).
 * Not responsible for: the step list itself (`types.ts`) or the deal (`initial-state.ts`).
 *
 * @module playtest/engine/turn
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import { PHASES, type PlaytestEngine } from "./types";

// ─── Draw card ────────────────────────────────────────────────────────────
/**
 * Draws the top card of the library into the hand (CR 121.1), outside the draw step: the
 * "draw a card" button, for an effect the player resolves by hand.
 *
 * Returns the same state while a bottom choice is pending or when the library is empty; the
 * engine does not model losing on an empty draw (CR 704.5b).
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyDrawCard(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (state.library.length === 0) return state;

  const [drawn, ...rest] = state.library;
  return pushHistory(
    state,
    deps.clock,
    {
      hand: [...state.hand, drawn],
      library: rest,
    },
    "Drew a card",
    { kind: "draw" }
  );
}

// ─── First-turn draw ──────────────────────────────────────────────────────
/** The zones and log a move starts from once any turn-1 draw still owed is taken. */
type AfterFirstTurnDraw = Pick<
  PlaytestEngine,
  "hand" | "library" | "actionLog" | "nextActionId"
>;

/**
 * True while a multiplayer game has not yet left the Draw step of turn 1, so the starting
 * player's turn-1 draw is still to come. CR 103.8c: in a multiplayer game no player skips the
 * draw step of their first turn. CR 103.8a: in a two-player game the starting player does.
 */
function owesFirstTurnDraw(state: PlaytestEngine): boolean {
  return (
    state.multiplayer &&
    state.turn === 1 &&
    PHASES.indexOf(state.phase) <= PHASES.indexOf("Draw")
  );
}

/**
 * Takes the turn-1 draw a multiplayer game owes, for a move that leaves the Draw step of turn 1.
 *
 * The deal waits in that step so the player can mulligan first: mulligans come before the first
 * turn (CR 103.5, 103.8). The step's draw (CR 504.1) is therefore taken when the game leaves the
 * step, once the opening hand is kept. It gets its own log line of turn 1, ahead of the move's
 * line, and shares the move's undo entry.
 *
 * @param state - the state the move starts from
 * @returns the state's zones and log, with the top card drawn and logged when the draw is owed
 * and the library is not empty
 */
function takeFirstTurnDraw(state: PlaytestEngine): AfterFirstTurnDraw {
  const { hand, library, actionLog, nextActionId } = state;
  if (!owesFirstTurnDraw(state) || library.length === 0) {
    return { hand, library, actionLog, nextActionId };
  }
  const [drawn, ...rest] = library;
  return {
    hand: [...hand, drawn],
    library: rest,
    actionLog: [
      ...actionLog,
      {
        id: nextActionId,
        turn: state.turn,
        phase: state.phase,
        description: "Drew a card for turn 1",
        kind: "draw",
      },
    ],
    nextActionId: nextActionId + 1,
  };
}

// ─── Phase progression ────────────────────────────────────────────────────
/**
 * Advances to the next step of `PHASES`; from the last step it starts the next turn instead.
 *
 * Starting a turn this way untaps every permanent (CR 502.3) but draws nothing: the new turn
 * begins in its Untap step, and this engine draws when a turn starts in its Draw step
 * (`applyNextTurn`), not when the Draw step is reached. Leaving the Draw step of turn 1 takes
 * the turn-1 draw a multiplayer game owes (CR 103.8c). Returns the same state while a bottom
 * choice is pending.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyNextPhase(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const currentIndex = PHASES.indexOf(state.phase);
  const isLastPhase = currentIndex === PHASES.length - 1;

  if (isLastPhase) {
    // End → Untap of next turn (+ untap all permanents)
    const untappedBattlefield = state.battlefield.map((p) => ({
      ...p,
      tapped: false,
    }));

    return pushHistory(
      state,
      deps.clock,
      {
        turn: state.turn + 1,
        phase: "Untap" as const,
        battlefield: untappedBattlefield,
      },
      `Started turn ${state.turn + 1}`,
      { turn: state.turn + 1, phase: "Untap" }
    );
  }

  // Advance to next phase
  const nextPhase = PHASES[currentIndex + 1];
  if (nextPhase === undefined) return state;
  // Leaving the Draw step of turn 1 takes the draw a multiplayer game owes (CR 103.8c).
  const firstTurnDraw = state.phase === "Draw" ? takeFirstTurnDraw(state) : {};
  return pushHistory(
    state,
    deps.clock,
    { ...firstTurnDraw, phase: nextPhase },
    `Advanced to ${nextPhase}`
  );
}

// ─── Next turn ────────────────────────────────────────────────────────────
/**
 * Starts the next turn in its Draw step: untaps every permanent (CR 502.3) and draws the
 * turn's card (CR 504.1), when the library has one.
 *
 * From turn 1 it first takes the turn-1 draw a multiplayer game still owes (CR 103.8c), so
 * the player may draw two cards in one move; both draws are logged as of their own turn and
 * undone together. Returns the same state while a bottom choice is pending.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyNextTurn(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  // Untap all permanents
  const untappedBattlefield = state.battlefield.map((p) => ({
    ...p,
    tapped: false,
  }));

  // Leaving turn 1 leaves its Draw step too: a multiplayer game takes the turn-1 draw it still
  // owes (CR 103.8c) before the new turn's own.
  const start = takeFirstTurnDraw(state);

  // Draw a card if library not empty
  let newHand = start.hand;
  let newLibrary = start.library;
  const drawsForNewTurn = start.library.length > 0;

  if (drawsForNewTurn) {
    const [drawn, ...rest] = start.library;
    newHand = [...start.hand, drawn];
    newLibrary = rest;
  }

  return pushHistory(
    state,
    deps.clock,
    {
      ...start,
      turn: state.turn + 1,
      phase: "Draw" as const,
      hand: newHand,
      library: newLibrary,
      battlefield: untappedBattlefield,
    },
    drawsForNewTurn
      ? `Started turn ${state.turn + 1} and drew a card`
      : `Started turn ${state.turn + 1}`,
    {
      turn: state.turn + 1,
      phase: "Draw",
      ...(drawsForNewTurn ? { kind: "draw" as const } : {}),
    }
  );
}
