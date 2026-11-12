/**
 * Draw evidence for a goldfish run: how many cards the player has seen, measured against the
 * kept opening hand plus one natural draw per turn.
 *
 * Context: playtest. The playtest modal shows it, and a recorded session stores its counts.
 *
 * @module playtest/draw-progress-evidence
 */
import { keptOpeningHandSize, type PlaytestEngine } from "./engine";

/** Draw-progression verdict for the current goldfish run. */
export type DrawProgressStatus = "natural" | "drawing-extra" | "library-empty";

/** Inputs available from the in-memory playtest engine. */
export interface DrawProgressInput {
  readonly turn: number;
  /** Whether the game began with more than two players, which decides the turn-1 draw. */
  readonly multiplayer: boolean;
  /** Mulligans taken for the opening hand. */
  readonly mulliganCount: number;
  /** Whether the format's first mulligan is free (CR 103.5c). */
  readonly firstMulliganFree: boolean;
  readonly cardsOutsideLibrary: number;
  readonly libraryCount: number;
}

/** Deterministic evidence about how many cards the run has accessed. */
export interface DrawProgressEvidence {
  readonly cardsSeen: number;
  readonly additionalCardsSeen: number;
  readonly status: DrawProgressStatus;
}

/**
 * Compares cards seen with the kept opening hand plus the natural draws so far.
 *
 * A multiplayer game draws on every turn, turn 1 included (CR 103.8c). A two-player game
 * draws on every turn after the first, since the starting player skips the turn-1 draw
 * (CR 103.8a). The playtest always plays the starting player.
 *
 * @param input - current turn, table size and zone counts from the playtest engine
 * @returns cards seen, extra cards seen, and the strongest relevant verdict
 */
export function analyzeDrawProgress(
  input: DrawProgressInput
): DrawProgressEvidence {
  const naturalDraws = Math.max(
    0,
    input.multiplayer ? input.turn : input.turn - 1
  );
  const naturalCardsSeen = keptOpeningHandSize(input) + naturalDraws;
  const additionalCardsSeen = Math.max(
    0,
    input.cardsOutsideLibrary - naturalCardsSeen
  );

  if (input.libraryCount === 0) {
    return {
      cardsSeen: input.cardsOutsideLibrary,
      additionalCardsSeen,
      status: "library-empty",
    };
  }

  return {
    cardsSeen: input.cardsOutsideLibrary,
    additionalCardsSeen,
    status: additionalCardsSeen > 0 ? "drawing-extra" : "natural",
  };
}

/**
 * Counts the deck's cards that have left the library.
 *
 * Commanders are left out wherever they are: they start in the command zone
 * (CR 903.6), so casting one is not a card drawn.
 *
 * @param engine - current in-memory playtest state
 * @returns cards in hand, on the battlefield, in the graveyard or in exile
 */
function countCardsOutsideLibrary(engine: PlaytestEngine): number {
  const commanderIds = new Set(engine.commanderIds);
  let count = 0;
  for (const zone of [engine.hand, engine.battlefield, engine.graveyard, engine.exile]) {
    for (const card of zone) {
      if (!commanderIds.has(card.id)) count += 1;
    }
  }
  return count;
}

/**
 * Reads draw-progression evidence from a playtest state, so every view counts
 * the kept hand under the same mulligan rule and the cards seen the same way.
 *
 * While a London mulligan's bottom choice is pending, the cards still to
 * bottom are going back to the library (CR 103.5), so they are left out of the
 * cards seen; otherwise they would read as extra cards.
 *
 * @param engine - current in-memory playtest state
 * @returns cards seen, extra cards seen, and the strongest relevant verdict
 */
export function analyzeEngineDrawProgress(
  engine: PlaytestEngine
): DrawProgressEvidence {
  return analyzeDrawProgress({
    turn: engine.turn,
    multiplayer: engine.multiplayer,
    mulliganCount: engine.mulliganCount,
    firstMulliganFree: engine.firstMulliganFree,
    cardsOutsideLibrary: Math.max(
      0,
      countCardsOutsideLibrary(engine) - engine.cardsToBottom
    ),
    libraryCount: engine.library.length,
  });
}
