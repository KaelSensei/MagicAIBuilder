/**
 * One queue per runtime for every request the app sends to api.scryfall.com,
 * paced to Scryfall's published limits, and stopped while a 429 block runs.
 *
 * Card catalog context. The Scryfall client (`client.ts`), the server's cache
 * fills (`server-fetch.ts`) and the bulk card source send every API request
 * through it. In the browser it paces one visitor; on the server it paces one
 * function instance, shared by every visitor that instance serves, so the
 * shared cache's fills and the collection lookups wait in the same line.
 *
 * Scryfall's hard limits (https://scryfall.com/docs/api/rate-limits, read
 * 2026-11-26): 2 requests per second (500 ms) on /cards/search, /cards/named,
 * /cards/random and /cards/collection; 10 per minute (6 s) on /cards/manifest;
 * 10 per second (100 ms) on every other method. "Receiving an HTTP 429
 * response will result in your access being limited for 30 seconds";
 * continuing to overload the API after that "may result in a temporary or
 * permanent ban of your application", and "it is not acceptable to ignore
 * HTTP 429 responses" (same page). The page says nothing of `Retry-After`.
 *
 * The queue starts one request at a time, once the previous one settles. A
 * request starts at least `MIN_DELAY_MS` after the previous request of any
 * kind, and at least its endpoint's spacing (`ENDPOINT_SPACING_MS`) after the
 * previous request to the same endpoint.
 *
 * Responsible for honouring the block a 429 starts: from the moment a request
 * settles as a 429 until the block ends, the queue sends nothing. Not
 * responsible for retrying: the 429 reaches its caller as a failed request,
 * and so does every request the block refuses.
 *
 * @module scryfall/request-queue
 */
import { logger } from "@/lib/logger";
import { ScryfallApiError } from "./api-error";

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
 * How long a 429 blocks the queue when it carries no usable `Retry-After`, in
 * milliseconds: "Receiving an HTTP 429 response will result in your access
 * being limited for 30 seconds" (https://scryfall.com/docs/api/rate-limits,
 * read 2026-11-26).
 */
export const RATE_LIMIT_BLOCK_MS = 30_000;

/**
 * The longest block a `Retry-After` header can ask for, in milliseconds: four
 * times Scryfall's documented 30 seconds. Scryfall's page documents no
 * `Retry-After` (read 2026-11-26), so a longer delay more likely comes from a
 * proxy on the way than from Scryfall, and every Scryfall feature of the tab
 * or server instance fails until the block ends.
 */
export const MAX_RETRY_AFTER_MS = 120_000;

/** HTTP 429 Too Many Requests: Scryfall's answer to a client over its limits. */
const TOO_MANY_REQUESTS = 429;

/** The delay-seconds form of `Retry-After` (RFC 9110 §10.2.3): digits only. */
const DELAY_SECONDS = /^\d+$/;

const LOG_CONTEXT = "Scryfall queue";

/**
 * A request the queue refused to send because a 429 block was running.
 *
 * A `ScryfallApiError` with status 429, so every caller reads it as the 429
 * Scryfall would have answered: the search panel says Scryfall is
 * unavailable, and a cache fill fails with status 429.
 */
export class ScryfallBlockedError extends ScryfallApiError {
  /**
   * @param blockedUntil - when the block ends, on the queue clock's scale:
   *   epoch milliseconds on the wall clock
   */
  constructor(readonly blockedUntil: number) {
    super(
      TOO_MANY_REQUESTS,
      `not sent, rate limited until ${new Date(blockedUntil).toISOString()}`
    );
    this.name = "ScryfallBlockedError";
  }
}

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
   * Runs one Scryfall request in its turn, unless a 429 block is running.
   *
   * During a block the request fails at once rather than waiting for the
   * block to end: a player would otherwise watch a silent spinner for up to
   * 30 seconds, and a retry made meanwhile fails without touching the network.
   *
   * @param url - the absolute api.scryfall.com URL the request asks for
   * @param request - starts the request; called once, when its turn comes,
   *   and never during a block. Resolving to a `Response` with status 429, or
   *   rejecting with an error whose `status` is 429 (`HttpStatusError`),
   *   starts a block.
   * @returns what the request resolves to, or its rejection
   * @throws {ScryfallBlockedError} when its turn comes during a block
   */
  readonly schedule: <T>(url: string, request: () => Promise<T>) => Promise<T>;
  /** Forgets the line, the last start times and any block, as a fresh queue would. */
  readonly reset: () => void;
}

/** The HTTP status a settled request carries: a `Response`'s, or an HTTP failure's. */
function statusOf(settled: unknown): number | null {
  if (typeof settled !== "object" || settled === null) return null;
  if (!("status" in settled) || typeof settled.status !== "number") return null;
  return settled.status;
}

/**
 * How long a 429 blocks the queue, in milliseconds.
 *
 * Reads the delay-seconds form of `Retry-After` only. Its HTTP-date form, a
 * negative or fractional number, or no header at all gives Scryfall's
 * documented 30 seconds, and a delay over `MAX_RETRY_AFTER_MS` is capped. A
 * delay under one second, which in whole seconds means `0`, also gives 30
 * seconds: read as it stands it would end the block at once, so the 429 would
 * remove the protection instead of starting it. A failure such as
 * `HttpStatusError` carries no headers, so it gets 30 seconds.
 *
 * @param settled - what the request resolved to, or rejected with
 */
function blockLengthOf(settled: unknown): number {
  const retryAfter =
    settled instanceof Response ? settled.headers.get("retry-after") : null;
  if (retryAfter === null || !DELAY_SECONDS.test(retryAfter)) {
    return RATE_LIMIT_BLOCK_MS;
  }
  const delay = Number(retryAfter) * 1_000;
  if (delay < 1_000) return RATE_LIMIT_BLOCK_MS;
  return Math.min(delay, MAX_RETRY_AFTER_MS);
}

/**
 * Builds an empty queue that paces its requests on `clock` and keeps its own
 * 429 block: one block per queue instance.
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
  let blockedUntil = Number.NEGATIVE_INFINITY;
  let queue: Promise<void> = Promise.resolve();

  /** Earliest time a request to `endpoint` may start, on the clock's scale. */
  function earliestStart(endpoint: string): number {
    const anyRequest = lastStart + MIN_DELAY_MS;
    const spacing = ENDPOINT_SPACING_MS.get(endpoint);
    const previous = lastStartByEndpoint.get(endpoint);
    if (spacing === undefined || previous === undefined) return anyRequest;
    return Math.max(anyRequest, previous + spacing);
  }

  /** Starts a block when `settled` is a 429, and logs it once. */
  function blockAfter(endpoint: string, settled: unknown): void {
    if (statusOf(settled) !== TOO_MANY_REQUESTS) return;
    blockedUntil = clock.now() + blockLengthOf(settled);
    // The path only: a search URL carries the player's query.
    logger.warn(
      "Scryfall answered 429: no request until the block ends",
      LOG_CONTEXT,
      {
        endpoint,
        blockedUntil: new Date(blockedUntil).toISOString(),
      }
    );
  }

  /** Sends the request, and lets its outcome start a block. */
  async function send<T>(
    endpoint: string,
    request: () => Promise<T>
  ): Promise<T> {
    try {
      const answer = await request();
      blockAfter(endpoint, answer);
      return answer;
    } catch (error) {
      blockAfter(endpoint, error);
      throw error;
    }
  }

  function schedule<T>(url: string, request: () => Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      // Requests settle one at a time, so the block a 429 starts is recorded
      // before the next turn comes, including the turn of a request that was
      // already waiting when the 429 landed.
      if (clock.now() < blockedUntil) {
        throw new ScryfallBlockedError(blockedUntil);
      }
      const endpoint = new URL(url).pathname;
      const wait = earliestStart(endpoint) - clock.now();
      if (wait > 0) await clock.sleep(wait);
      lastStart = clock.now();
      if (ENDPOINT_SPACING_MS.has(endpoint)) {
        lastStartByEndpoint.set(endpoint, lastStart);
      }

      return send(endpoint, request);
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
    blockedUntil = Number.NEGATIVE_INFINITY;
    queue = Promise.resolve();
  }

  return { schedule, reset };
}

// One instance per runtime: a module is evaluated once per browser tab and once
// per server function instance, so every caller of the two functions below
// waits in the same line and shares one 429 block. A server instance's block
// protects that instance only: other instances keep their own line and block,
// and know nothing of this one's 429.
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
 * Forgets the runtime queue's line, last start times and 429 block, keeping
 * its clock.
 *
 * @internal for tests, between two cases that share the runtime queue
 */
export function resetScryfallQueue(): void {
  runtimeQueue.reset();
}

/**
 * Runs one Scryfall request in its turn in the runtime's queue, or refuses it
 * while the runtime's 429 block runs.
 *
 * @param url - the absolute api.scryfall.com URL the request asks for
 * @param request - starts the request; called once, when its turn comes
 * @returns what the request resolves to, or its rejection
 * @throws {ScryfallBlockedError} when its turn comes during a 429 block
 */
export function scheduleScryfallRequest<T>(
  url: string,
  request: () => Promise<T>
): Promise<T> {
  return runtimeQueue.schedule(url, request);
}
