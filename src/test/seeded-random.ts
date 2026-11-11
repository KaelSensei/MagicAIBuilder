/**
 * Seeded randomness for tests: the same seed replays the same numbers, so a test can name
 * the exact cards a shuffle deals and compare a whole game with an approved transcript.
 *
 * Production shuffles draw from Web Crypto (`src/lib/crypto-random.ts`) so nobody can predict
 * them (CR 701.24a: a shuffled library is in an order no player knows). A test needs the
 * opposite, a known sequence; this module is that sequence, and it is for tests only: it is
 * fast and repeatable, not secure.
 *
 * Algorithm: mulberry32, a 32-bit generator by Tommy Ettinger, released into the public domain
 * (https://gist.github.com/tommyettinger/46a874533244883189143505d203312c). One 32-bit word of
 * state, a period of 2^32 and good enough statistical quality for card shuffles.
 *
 * `intBelowFrom` turns the words into bounded integers with the rejection sampling that
 * `randomIntBelow` applies to Web Crypto's words. A seed reaches the engine through either
 * path and gives the same deal: `seededRandom` is an injected `RandomSource`, and
 * `replayWebCrypto` feeds the words to code that reads Web Crypto itself.
 *
 * @module test/seeded-random
 */

import { vi } from "vitest";
import type { RandomSource } from "@/lib/playtest/engine";

/** An endless stream of unsigned 32-bit words. Each call returns the next one. */
export type WordStream = () => number;

/** Size of the unsigned 32-bit range, as in `src/lib/crypto-random.ts`. */
const UINT32_RANGE = 2 ** 32;

/**
 * A mulberry32 word stream. The same seed always yields the same words.
 *
 * @param seed - any integer; it is reduced to its low 32 bits
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
 * Mirrors `randomIntBelow`: a word at or above the largest multiple of `upperExclusive` that
 * fits in 32 bits is discarded and the next one is read, so both consume the same words.
 *
 * @param upperExclusive - a positive integer
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
 * The playtest engine's `RandomSource`, replaying mulberry32 from `seed`.
 *
 * Each call starts its own stream, so two sources built from one seed give the same numbers,
 * and a source shared by several moves continues where the last move stopped.
 */
export function seededRandom(seed: number): RandomSource {
  const words = mulberry32(seed);
  return { intBelow: (upperExclusive) => intBelowFrom(words, upperExclusive) };
}

/**
 * Makes Web Crypto replay a word stream until the test restores its mocks
 * (`vi.restoreAllMocks()`): each `crypto.getRandomValues` call fills its `Uint32Array` from
 * `words`, one word per element.
 *
 * It lets a test drive production code that reads Web Crypto directly, such as
 * `randomIntBelow`, from a seed. Other array types throw a `TypeError`: nothing needs them yet,
 * and a silent zero-filled array would fake a deal.
 */
export function replayWebCrypto(words: WordStream): void {
  vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
    if (!(array instanceof Uint32Array)) {
      throw new TypeError("replayWebCrypto fills Uint32Array only");
    }
    for (let index = 0; index < array.length; index++) array[index] = words();
    return array;
  });
}
