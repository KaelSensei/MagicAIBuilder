/**
 * The two ports through which the playtest engine touches the platform: randomness and time.
 *
 * Context: playtest, the engine. Every transition that shuffles or stamps a time takes a
 * `PlaytestDeps` as its optional last argument and defaults to `defaultPlaytestDeps`, so a
 * test can replay a whole game from a seed (`src/test/seeded-random.ts`,
 * `engine-golden.test.ts`) while production reads Web Crypto and the system clock.
 * Not responsible for: the shuffle itself (`shuffle.ts`) or the undo stamps (`history.ts`).
 *
 * @module playtest/engine/ports
 */

import { randomIntBelow } from "@/lib/crypto-random";

/**
 * Where the engine's randomness comes from: the shuffle of the deal and of every mulligan.
 *
 * `intBelow(n)` returns a uniform integer in `[0, n)` for a positive integer `n`. A shuffle of
 * `k` cards asks for `k - 1` of them, from the last position down (Fisher–Yates), so a source
 * that replays the same numbers replays the same deal.
 */
export interface RandomSource {
  readonly intBelow: (upperExclusive: number) => number;
}

/**
 * Where the engine reads the time: the stamps on life-history and undo entries.
 *
 * `now()` returns milliseconds since the Unix epoch, as `Date.now()` does. Nothing orders or
 * compares the stamps; the life tracker uses them in list keys.
 */
export interface Clock {
  readonly now: () => number;
}

/** The ports a transition may use; each transition reads only the ones it needs. */
export interface PlaytestDeps {
  readonly random: RandomSource;
  readonly clock: Clock;
}

/**
 * The production ports: Web Crypto without modulo bias (`randomIntBelow`) and the system clock.
 *
 * Web Crypto, not `Math.random`, because a shuffle must leave the library in an order nobody
 * can predict (CR 701.24a). Both read the platform when called, not when this module loads, so
 * a test that stubs `crypto.getRandomValues` or fakes `Date` still reaches them.
 */
export const defaultPlaytestDeps: PlaytestDeps = {
  random: { intBelow: (upperExclusive) => randomIntBelow(upperExclusive) },
  clock: { now: () => Date.now() },
};
