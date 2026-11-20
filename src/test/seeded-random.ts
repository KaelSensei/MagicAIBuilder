/**
 * Seeded randomness for tests: the same seed replays the same numbers, so a test can name
 * the exact cards a shuffle deals and compare a whole game with an approved transcript.
 *
 * The generator itself is product code (`src/lib/playtest/engine/seeded-rng.ts`, I-21): the
 * probability bench and these tests share one mulberry32, so a seed cannot drift between
 * them. This file only adds the Vitest seam that feeds those words to code reading Web
 * Crypto directly. It is not a second algorithm.
 *
 * Production shuffles of a live game still draw from Web Crypto (`src/lib/crypto-random.ts`)
 * so nobody can predict them (CR 701.24a). A test needs the opposite, a known sequence.
 *
 * @module test/seeded-random
 */

import { vi } from "vitest";
import type { RandomSource } from "@/lib/playtest/engine";
import {
  createSeededRandom,
  type WordStream,
} from "@/lib/playtest/engine/seeded-rng";

export {
  intBelowFrom,
  mulberry32,
  type WordStream,
} from "@/lib/playtest/engine/seeded-rng";

/**
 * The playtest engine's `RandomSource`, replaying mulberry32 from `seed`.
 *
 * Each call starts its own stream, so two sources built from one seed give the same numbers,
 * and a source shared by several moves continues where the last move stopped.
 */
export function seededRandom(seed: number): RandomSource {
  return createSeededRandom(seed);
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
