/**
 * One queue per runtime for every request the app sends to api.scryfall.com,
 * paced to Scryfall's published limits.
 *
 * Card catalog context. The Scryfall client (`client.ts`) and the server's
 * cache fills (`server-fetch.ts`) send every request through it. In the
 * browser it paces one visitor; on the server it paces one function instance,
 * shared by every visitor that instance serves, so the shared cache's fills
 * and the collection lookups wait in the same line.
 *
 * Scryfall's hard limits (https://scryfall.com/docs/api/rate-limits, read
 * 2026-11-10): 2 requests per second (500 ms) on /cards/search, /cards/named,
 * /cards/random and /cards/collection; 10 per minute (6 s) on /cards/manifest;
 * 10 per second (100 ms) on every other method. A 429 answer limits access for
 * 30 seconds, and an application that keeps overloading the API may be banned.
 *
 * The queue starts one request at a time, once the previous one settles. A
 * request starts at least `MIN_DELAY_MS` after the previous request of any
 * kind, and at least its endpoint's spacing (`ENDPOINT_SPACING_MS`) after the
 * previous request to the same endpoint.
 *
 * Not responsible for retrying a 429: callers see it as a failed request.
 *
 * @module scryfall/request-queue
 */

/**
 * Least time between the starts of any two requests, in milliseconds: the
 * 10-per-second limit of the methods `ENDPOINT_SPACING_MS` does not name.
 */
export const MIN_DELAY_MS = 100;

/**
 * Least time between two requests to the same endpoint, in milliseconds, for
 * the endpoints Scryfall limits more strictly; keyed by URL path. Only these
 * endpoints are tracked, so card-by-id paths never pile up in memory.
 */
export const ENDPOINT_SPACING_MS: ReadonlyMap<string, number> = new Map([
  ["/cards/search", 500],
  ["/cards/named", 500],
  ["/cards/random", 500],
  ["/cards/collection", 500],
  ["/cards/manifest", 6_000],
]);

/**
 * The time a queue reads and the waits it takes: its only contact with real
 * time, so a test can drive the spacing without timers or real waiting.
 */
export interface QueueClock {
  /** The current time in milliseconds, on the same scale as `Date.now()`. */
  readonly now: () => number;
  /** Resolves once `ms` milliseconds have passed; `ms` is always positive. */
  readonly sleep: (ms: number) => Promise<void>;
}

/** The wall clock, `Date.now` and `setTimeout`: what a queue uses unless told otherwise. */
export const WALL_CLOCK: QueueClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** A line of Scryfall requests, each started in its turn. */
export interface ScryfallQueue {
  /**
   * Runs one Scryfall request in its turn.
   *
   * @param url - the absolute api.scryfall.com URL the request asks for
   * @param request - starts the request; called once, when its turn comes
   * @returns what the request resolves to, or its rejection
   */
  readonly schedule: <T>(url: string, request: () => Promise<T>) => Promise<T>;
  /** Forgets the line and the last start times, as a fresh queue would. */
  readonly reset: () => void;
}

/**
 * Builds an empty queue that paces its requests on `clock`.
 *
 * A clock whose `sleep` returns at once gives a queue that keeps only the
 * one-at-a-time order, which is what the test suites' runtime queue runs on.
 *
 * @param clock - the wall clock unless a test injects its own
 */
export function createScryfallQueue(
  clock: QueueClock = WALL_CLOCK
): ScryfallQueue {
  let lastStart = 0;
  const lastStartByEndpoint = new Map<string, number>();
  let queue: Promise<void> = Promise.resolve();

  /** Earliest time a request to `endpoint` may start, on the clock's scale. */
  function earliestStart(endpoint: string): number {
    const anyRequest = lastStart + MIN_DELAY_MS;
    const spacing = ENDPOINT_SPACING_MS.get(endpoint);
    const previous = lastStartByEndpoint.get(endpoint);
    if (spacing === undefined || previous === undefined) return anyRequest;
    return Math.max(anyRequest, previous + spacing);
  }

  function schedule<T>(url: string, request: () => Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      const endpoint = new URL(url).pathname;
      const wait = earliestStart(endpoint) - clock.now();
      if (wait > 0) await clock.sleep(wait);
      lastStart = clock.now();
      if (ENDPOINT_SPACING_MS.has(endpoint)) {
        lastStartByEndpoint.set(endpoint, lastStart);
      }

      return request();
    });

    // Handing the tail back to `queue` is what makes this a mutex. The previous
    // version chained off `queue` but never reassigned it, so every concurrent
    // caller found the same already-resolved promise and ran immediately: they
    // read one last start time, waited the same delay, and then fired at
    // Scryfall together — no spacing was ever enforced.
    //
    // The tail must not reject, or one failed request would poison the chain for
    // every request after it. Swallowing here only affects the ordering handle;
    // `run` still carries the rejection to this call's own caller.
    queue = run.then(
      () => undefined,
      () => undefined
    );

    return run;
  }

  function reset(): void {
    lastStart = 0;
    lastStartByEndpoint.clear();
    queue = Promise.resolve();
  }

  return { schedule, reset };
}

// One instance per runtime: a module is evaluated once per browser tab and once
// per server function instance, so every caller of the two functions below
// waits in the same line.
let runtimeQueue = createScryfallQueue();

/**
 * Rebuilds the runtime's queue on `clock`, forgetting its line and its last
 * start times.
 *
 * The seam the Vitest setup (`src/test/unpaced-scryfall-queue.ts`) uses to put
 * the runtime's queue on a clock that never waits, so suites that call the
 * Scryfall client for real stay fast while this module carries no test-mode
 * branch of its own. Nothing in production calls it.
 *
 * @internal
 */
export function setScryfallQueueClock(clock: QueueClock): void {
  runtimeQueue = createScryfallQueue(clock);
}

/**
 * Forgets the runtime queue's line and last start times, keeping its clock.
 *
 * @internal for tests, between two cases that share the runtime queue
 */
export function resetScryfallQueue(): void {
  runtimeQueue.reset();
}

/**
 * Runs one Scryfall request in its turn in the runtime's queue.
 *
 * @param url - the absolute api.scryfall.com URL the request asks for
 * @param request - starts the request; called once, when its turn comes
 * @returns what the request resolves to, or its rejection
 */
export function scheduleScryfallRequest<T>(
  url: string,
  request: () => Promise<T>
): Promise<T> {
  return runtimeQueue.schedule(url, request);
}
