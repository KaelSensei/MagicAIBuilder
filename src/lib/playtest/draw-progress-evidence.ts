import { keptOpeningHandSize, type PlaytestEngine } from "./engine";

/** Draw-progression verdict for the current goldfish run. */
export type DrawProgressStatus = "natural" | "drawing-extra" | "library-empty";

/** Inputs available from the in-memory playtest engine. */
export interface DrawProgressInput {
  readonly turn: number;
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
 * Compares cards seen with an opening hand plus one natural draw per later turn.
 *
 * @param input - current turn and zone counts from the playtest engine
 * @returns cards seen, extra cards seen, and the strongest relevant verdict
 */
export function analyzeDrawProgress(
  input: DrawProgressInput
): DrawProgressEvidence {
  const naturalDraws = Math.max(0, input.turn - 1);
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
 * Reads draw-progression evidence from a playtest state, so every view counts
 * the kept hand under the same mulligan rule.
 *
 * @param engine - current in-memory playtest state
 * @returns cards seen, extra cards seen, and the strongest relevant verdict
 */
export function analyzeEngineDrawProgress(
  engine: PlaytestEngine
): DrawProgressEvidence {
  return analyzeDrawProgress({
    turn: engine.turn,
    mulliganCount: engine.mulliganCount,
    firstMulliganFree: engine.firstMulliganFree,
    cardsOutsideLibrary:
      engine.hand.length +
      engine.battlefield.length +
      engine.graveyard.length +
      engine.exile.length,
    libraryCount: engine.library.length,
  });
}
