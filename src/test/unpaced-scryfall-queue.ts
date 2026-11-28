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
 * After every test the runtime queue is reset. A Scryfall 429 that one test
 * answers starts a 30-second block in which the queue sends nothing, and
 * without the reset that block would refuse the next tests' requests.
 *
 * The queue module is imported inside the hooks, once the test file's own
 * imports and `vi.mock` calls are in place, never at the top of this file. The
 * queue imports the logger, and the logger imports Sentry: a static import here
 * would load both before a test file could mock them, as `logger.test.ts` and
 * `route-kit.test.ts` mock `@sentry/nextjs`.
 *
 * @module test/unpaced-scryfall-queue
 */
import { afterEach, beforeAll } from "vitest";

/** The queue module of the test file's registry, loaded on first use. */
const requestQueue = () => import("@/lib/scryfall/request-queue");

beforeAll(async () => {
  const { setScryfallQueueClock } = await requestQueue();
  setScryfallQueueClock({
    now: () => Date.now(),
    sleep: () => Promise.resolve(),
  });
});

afterEach(async () => {
  const { resetScryfallQueue } = await requestQueue();
  resetScryfallQueue();
});
