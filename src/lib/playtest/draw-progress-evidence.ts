import { OPENING_HAND_SIZE } from "./engine";

/** Draw-progression verdict for the current goldfish run. */
export type DrawProgressStatus = "natural" | "drawing-extra" | "library-empty";

/** Inputs available from the in-memory playtest engine. */
export interface DrawProgressInput {
  readonly turn: number;
  readonly mulliganCount: number;
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
  const keptOpeningHandSize = Math.max(
    0,
    OPENING_HAND_SIZE - input.mulliganCount
  );
  const naturalDraws = Math.max(0, input.turn - 1);
  const naturalCardsSeen = keptOpeningHandSize + naturalDraws;
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
