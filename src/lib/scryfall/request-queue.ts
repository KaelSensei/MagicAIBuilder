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
const MIN_DELAY_MS = 100;

/**
 * Least time between two requests to the same endpoint, in milliseconds, for
 * the endpoints Scryfall limits more strictly; keyed by URL path. Only these
 * endpoints are tracked, so card-by-id paths never pile up in memory.
 */
const ENDPOINT_SPACING_MS: ReadonlyMap<string, number> = new Map([
  ["/cards/search", 500],
  ["/cards/named", 500],
  ["/cards/random", 500],
  ["/cards/collection", 500],
  ["/cards/manifest", 6_000],
]);

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
 * Builds an empty queue.
 *
 * @param options.paced - false skips the waits and keeps only the one-at-a-time
 *   order; the runtime queue sets it under Vitest (see `isTestMode`)
 */
export function createScryfallQueue(options: {
  readonly paced: boolean;
}): ScryfallQueue {
  let lastStart = 0;
  const lastStartByEndpoint = new Map<string, number>();
  let queue: Promise<void> = Promise.resolve();

  /** Earliest time a request to `endpoint` may start, as a `Date.now()` value. */
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
      const wait = earliestStart(endpoint) - Date.now();
      if (wait > 0 && options.paced) {
        await new Promise<void>((resolve) => setTimeout(resolve, wait));
      }
      lastStart = Date.now();
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

// Detect if we're in a test environment (vitest sets globalThis.vi)
function isTestMode(): boolean {
  return typeof globalThis !== "undefined" && "vi" in globalThis;
}

// The runtime's queue skips its waits under Vitest, where most suites call the
// Scryfall client without fake timers; pacing is tested on a queue of its own.
// CC-02 replaces this switch with an injected clock.
const runtimeQueue = createScryfallQueue({ paced: !isTestMode() });

/**
 * Reset the queue (for tests only)
 * @internal
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
