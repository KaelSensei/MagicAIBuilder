/**
 * Puts the runtime Scryfall queue on a clock that never waits, for every test file.
 *
 * Loaded by `vitest.setup.ts`. The suites that call the Scryfall client or the
 * server's cache fills for real reach `scheduleScryfallRequest`, whose runtime
 * queue paces requests to Scryfall's published limits on the wall clock. Under
 * tests those waits would add up to 500 ms per request and never end in a suite
 * that uses fake timers. Only the waits go: the one-at-a-time order stays, which
 * is what `client.test.ts` asserts. The spacing itself is tested on a queue of
 * its own in `request-queue.test.ts`, on an injected clock.
 *
 * Vitest evaluates a setup file in the test file's own module registry, so the
 * queue swapped here is the one the file's imports reach. A test that calls
 * `vi.resetModules()` and re-imports the client gets a fresh queue on the wall
 * clock; the tests that do so today never send a Scryfall request.
 *
 * @module test/unpaced-scryfall-queue
 */
import { setScryfallQueueClock } from "@/lib/scryfall/request-queue";

setScryfallQueueClock({
  now: () => Date.now(),
  sleep: () => Promise.resolve(),
});
