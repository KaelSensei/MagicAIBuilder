/**
 * The one shuffle the engine uses, for the deal and for every mulligan.
 *
 * Context: playtest, the engine. Both `initial-state.ts` and `mulligan.ts` call it with the
 * `RandomSource` port, so a seeded source replays the same order through both.
 * Rules: a shuffled library is in an order no player knows (CR 701.24a).
 *
 * @module playtest/engine/shuffle
 */

import type { RandomSource } from "./ports";

// ─── Shuffle ──────────────────────────────────────────────────────────────
/**
 * Returns a shuffled copy (Fisher–Yates), asking `random` for one index per position from the
 * last down; the input is not changed.
 */
export function shuffleCards<T>(
  cards: readonly T[],
  random: RandomSource
): T[] {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = random.intBelow(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
