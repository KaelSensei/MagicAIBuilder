/**
 * The ports through which the playtest engine touches the platform: randomness, time and the ids
 * of the cards a game creates.
 *
 * Context: playtest, the engine. Every transition that shuffles or stamps a time takes a
 * `PlaytestDeps` as its optional last argument and defaults to `defaultPlaytestDeps`, so a
 * test can replay a whole game from a seed (`src/test/seeded-random.ts`,
 * `engine-golden.test.ts`) while production reads Web Crypto and the system clock. A command
 * (`commands.ts`) takes a `PlaytestCommandDeps`, the same ports plus `newId`, because creating a
 * copy or a token needs an id the transitions receive ready-made.
 * Not responsible for: the shuffle itself (`shuffle.ts`) or the undo stamps (`history.ts`).
 *
 * @module playtest/engine/ports
 */

import { randomAlphanumericId, randomIntBelow } from "@/lib/crypto-random";

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

/**
 * Where the ids of the cards a game creates come from: the playtest-only copies and tokens.
 *
 * Each call returns a fresh id body, unique within the game. The engine prefixes it
 * (`playtest-copy-`, `playtest-token-`, see `commands.ts`) so a session card is told apart from a
 * deck card. A test returns a known string, so a whole game is reproducible.
 */
export type NewId = () => string;

/** The ports a command may use: the transitions' `PlaytestDeps` plus the id source. */
export interface PlaytestCommandDeps extends PlaytestDeps {
  readonly newId: NewId;
}

/**
 * The production id source: 16 lowercase alphanumeric characters from Web Crypto, the body the
 * store generated for its copies and tokens before the reducer took over.
 */
export const defaultNewId: NewId = () => randomAlphanumericId(16);

/** The production ports for a command: `defaultPlaytestDeps` and `defaultNewId`. */
export const defaultPlaytestCommandDeps: PlaytestCommandDeps = {
  ...defaultPlaytestDeps,
  newId: defaultNewId,
};
