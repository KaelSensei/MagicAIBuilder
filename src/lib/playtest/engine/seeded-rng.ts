/**
 * The seeded generator the probability bench shuffles with (I-21 slice 1).
 *
 * Context: playtest, the engine. A recorded seed must deal the same library again, on any
 * machine, so the bench can quote a result. The goldfish engine already shuffles through a
 * `RandomSource` (`shuffle.ts`); this module is that source when the seed is known.
 * Algorithm: mulberry32, a 32-bit generator by Tommy Ettinger, public domain
 * (https://gist.github.com/tommyettinger/46a874533244883189143505d203312c, the same one the
 * opening-hands research model uses). Indices use rejection sampling, not `Math.random`,
 * because a float would not match across engines (I-21, measured 2026-11-09).
 * Not responsible for: mulligan policy, intervals or a two-snapshot verdict (I-21 slices 2–5).
 *
 * @module playtest/engine/seeded-rng
 */

import type { RandomSource } from "./ports";
import { shuffleCards } from "./shuffle";

/** Size of the unsigned 32-bit range, as in `src/lib/crypto-random.ts`. */
const UINT32_RANGE = 2 ** 32;

/** An endless stream of unsigned 32-bit words. Each call returns the next one. */
export type WordStream = () => number;

/**
 * A mulberry32 word stream. The same seed always yields the same words.
 *
 * Any number is reduced to its low 32 bits, so `1.7` matches `1` and a negative seed stays
 * defined. The stream is not cryptographically secure; a live game keeps using Web Crypto
 * (CR 701.24a). This one is for a result someone else can rerun.
 *
 * @param seed - any finite number; only its low 32 bits are kept
 */
export function mulberry32(seed: number): WordStream {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return (mixed ^ (mixed >>> 14)) >>> 0;
  };
}

/**
 * A uniform integer in `[0, upperExclusive)` drawn from the stream, without modulo bias.
 *
 * A word at or above the largest multiple of `upperExclusive` that fits in 32 bits is
 * discarded and the next one is read, matching `randomIntBelow` so a seed deals the same
 * cards through either path.
 *
 * @param words - the stream, advanced once per candidate word
 * @param upperExclusive - a positive integer; the deck size the shuffle is choosing under
 * @returns an integer in `[0, upperExclusive)`
 * @throws RangeError when `upperExclusive` is not a positive integer
 */
export function intBelowFrom(
  words: WordStream,
  upperExclusive: number
): number {
  if (!Number.isInteger(upperExclusive) || upperExclusive <= 0) {
    throw new RangeError(
      "intBelowFrom: upperExclusive must be a positive integer"
    );
  }
  const limit = Math.floor(UINT32_RANGE / upperExclusive) * upperExclusive;
  let word = words();
  while (word >= limit) word = words();
  return word % upperExclusive;
}

/**
 * The engine's `RandomSource`, replaying mulberry32 from `seed`.
 *
 * Two sources built from one seed give the same indices. One source shared by several
 * shuffles continues where the last shuffle stopped.
 *
 * @param seed - the run's seed; reduced to its low 32 bits
 */
export function createSeededRandom(seed: number): RandomSource {
  const words = mulberry32(seed);
  return {
    intBelow: (upperExclusive) => intBelowFrom(words, upperExclusive),
  };
}

/**
 * Shuffles `cards` with the bench's seeded generator.
 *
 * The same seed and the same library produce the same order. The input array is not
 * changed, and `Math.random` is never called.
 *
 * @param cards - the library, in a fixed order
 * @param seed - the run's seed; reduced to its low 32 bits
 * @returns a new array; empty and one-card libraries come back unchanged
 */
export function shuffleWithSeed<T>(
  cards: readonly T[],
  seed: number
): readonly T[] {
  return shuffleCards(cards, createSeededRandom(seed));
}
