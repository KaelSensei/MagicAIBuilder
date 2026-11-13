/**
 * Draw odds: the exact chance that cards drawn from a library hold at least a
 * minimum number of matching cards, such as three lands in the first seven.
 *
 * Deck analysis, I-97. The figure counts equally likely hands
 * (hypergeometric distribution); it is not a simulated or recorded game, so
 * the same question always gets the same answer.
 * Not responsible for: choosing the library size or the matching count from a
 * deck (commanders start in the command zone, CR 903.6, and Sideboard and
 * Considering cards are not in the library; `countLibrary` in
 * `draw-odds-library.ts` reads them), the cards drawn by a turn
 * (`cardsDrawnBy` in `cards-drawn.ts`), or the panel that asks
 * (`components/deck/DrawOddsPanel.tsx`).
 *
 * @module deck/draw-odds
 */

import { binomial } from "./binomial";

/** One draw-odds question, in card counts. */
export interface DrawOddsQuestion {
  /** Cards in the library */
  readonly librarySize: number;
  /** Library cards that count as a hit: the lands, or the copies of one card */
  readonly matching: number;
  /** Cards drawn: the starting hand of seven (CR 103.5), plus later draws */
  readonly drawn: number;
  /** Fewest matching cards among those drawn that answers "yes" */
  readonly minimum: number;
}

/**
 * Why a draw-odds question has no answer, so the panel can say what is
 * missing instead of showing a zero:
 * - `empty-library`: the library holds no cards yet.
 * - `more-drawn-than-library`: the draw asks for more cards than the library
 *   holds, such as a late turn with a short library.
 * - `more-matching-than-library`: more matching cards than the library holds,
 *   which no real deck can produce.
 * - `not-a-card-count`: a count that is negative or not a whole number.
 */
export type DrawOddsGap =
  | "empty-library"
  | "more-drawn-than-library"
  | "more-matching-than-library"
  | "not-a-card-count";

/** The answer to a draw-odds question, or the reason there is none. */
export type DrawOdds =
  | {
      readonly kind: "known";
      /** Chance of at least the minimum, in 0–1 */
      readonly probability: number;
    }
  | { readonly kind: "unknown"; readonly reason: DrawOddsGap };

/**
 * Whether a value can be a number of cards: whole and not negative.
 *
 * @param count - the value to check
 */
function isCardCount(count: number): boolean {
  return Number.isInteger(count) && count >= 0;
}

/**
 * The reason a question has no answer, checked in the order a player would fix
 * it: an unusable count first, then an empty library, then impossible sizes.
 *
 * @param question - the question to check
 * @returns the gap, or `null` when the question can be answered
 */
function findGap(question: DrawOddsQuestion): DrawOddsGap | null {
  const { librarySize, matching, drawn, minimum } = question;
  if (![librarySize, matching, drawn, minimum].every(isCardCount)) {
    return "not-a-card-count";
  }
  if (librarySize === 0) return "empty-library";
  if (drawn > librarySize) return "more-drawn-than-library";
  if (matching > librarySize) return "more-matching-than-library";
  return null;
}

/**
 * Share of all equally likely draws that hold at least the minimum.
 *
 * @param question - an answerable question (see `findGap`)
 * @returns the chance, in 0–1
 */
function shareOfHitHands(question: DrawOddsQuestion): number {
  const { librarySize, matching, drawn, minimum } = question;
  const others = librarySize - matching;
  const allHands = binomial(librarySize, drawn);

  let hitHands = 0;
  for (let hits = minimum; hits <= Math.min(matching, drawn); hits += 1) {
    hitHands += binomial(matching, hits) * binomial(others, drawn - hits);
  }

  // Long draws push the hand counts past exact doubles; the sum can then
  // overshoot the total by a rounding step, and a chance above 1 is false.
  return Math.min(1, hitHands / allHands);
}

/**
 * Chance that the cards drawn hold at least `minimum` matching cards.
 *
 * Sums the hypergeometric probabilities of every count from the minimum up to
 * the most that can be drawn: Σ C(matching, i) · C(others, drawn − i), over
 * C(librarySize, drawn). No randomness and no stored result: the same question
 * always gets the same digits.
 *
 * @example
 * // Three or more of 36 lands in the first seven of a 99-card library:
 * chanceOfAtLeast({ librarySize: 99, matching: 36, drawn: 7, minimum: 3 });
 * // → { kind: "known", probability: ≈ 0.5011 } (26,736,733 / 53,358,536)
 *
 * @param question - the library, the matching cards, the draw and the minimum
 * @returns the exact chance, or `unknown` with the reason the question cannot
 *   be answered; never a zero standing in for a missing value
 */
export function chanceOfAtLeast(question: DrawOddsQuestion): DrawOdds {
  const gap = findGap(question);
  if (gap !== null) return { kind: "unknown", reason: gap };
  return { kind: "known", probability: shareOfHitHands(question) };
}
