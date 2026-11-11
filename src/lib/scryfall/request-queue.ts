/**
 * One queue per runtime for every request the app sends to api.scryfall.com.
 *
 * Scryfall asks for 50–100 ms between requests, about 10 a second. The queue
 * starts one request at a time and leaves at least `MIN_DELAY_MS` between
 * starts. In the browser it paces one visitor; on the server it paces one
 * function instance, shared by every visitor that instance serves, so the
 * shared cache's fills and the collection lookups wait in the same line.
 */

const MIN_DELAY_MS = 100;

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
  /** Forgets the line and the last start time, as a fresh queue would. */
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
  let lastRequestTime = 0;
  let queue: Promise<void> = Promise.resolve();

  function schedule<T>(_url: string, request: () => Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      const elapsed = Date.now() - lastRequestTime;
      if (elapsed < MIN_DELAY_MS && options.paced) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, MIN_DELAY_MS - elapsed)
        );
      }
      lastRequestTime = Date.now();

      return request();
    });

    // Handing the tail back to `queue` is what makes this a mutex. The previous
    // version chained off `queue` but never reassigned it, so every concurrent
    // caller found the same already-resolved promise and ran immediately: they
    // read one `lastRequestTime`, waited the same delay, and then fired at
    // Scryfall together — the 10 req/s ceiling the comment promises was never
    // enforced.
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
    lastRequestTime = 0;
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
