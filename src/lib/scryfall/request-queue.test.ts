/**
 * Spacing of the Scryfall request queue, and the block a 429 starts, measured
 * on an injected clock.
 *
 * Each expectation is read from the queue's own constants (`MIN_DELAY_MS`,
 * `ENDPOINT_SPACING_MS`, `RATE_LIMIT_BLOCK_MS`, `MAX_RETRY_AFTER_MS`), never
 * from a number typed here: the Scryfall limits the constants cite
 * (https://scryfall.com/docs/api/rate-limits, read 2026-11-26) are documented
 * on the constants, and this suite pins that the queue applies them. Only a
 * `Retry-After` value a test sends is typed here. The queue runs on a fake
 * clock whose `sleep` moves time forward, so no timer and no real wait is
 * involved; two tests drive the default wall clock with Vitest fake timers to
 * pin that wiring.
 *
 * @module scryfall/request-queue.test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpStatusError } from "@/lib/http";
import { logger } from "@/lib/logger";
import { ScryfallApiError } from "./api-error";
import {
  createScryfallQueue,
  ENDPOINT_SPACING_MS,
  MAX_RETRY_AFTER_MS,
  MIN_DELAY_MS,
  RATE_LIMIT_BLOCK_MS,
  ScryfallBlockedError,
  type QueueClock,
} from "./request-queue";

const SCRYFALL = "https://api.scryfall.com";
const CARD_BY_ID = `${SCRYFALL}/cards/0000579f-7b35-4ed3-b44c-db2a538066fe`;
const SEARCH = `${SCRYFALL}/cards/search?q=sol`;
const NAMED = `${SCRYFALL}/cards/named?exact=Sol%20Ring`;

/** The spacing the constants give an endpoint, which every paced endpoint has. */
function spacingOf(path: string): number {
  const spacing = ENDPOINT_SPACING_MS.get(path);
  if (spacing === undefined) throw new Error(`${path} is not a paced endpoint`);
  return spacing;
}

/**
 * A clock the test moves by hand. `sleep` jumps straight to the end of the
 * wait, so a paced queue runs in microtasks and the recorded start times show
 * exactly how long it chose to wait.
 */
interface FakeClock extends QueueClock {
  /** Moves the clock forward without going through the queue, as a slow request would. */
  readonly advance: (ms: number) => void;
}

function createFakeClock(start = 1_700_000_000_000): FakeClock {
  let now = start;
  return {
    now: () => now,
    sleep: (ms) => {
      now += ms;
      return Promise.resolve();
    },
    advance: (ms) => {
      now += ms;
    },
  };
}

/** What each request of a run recorded: its start, in milliseconds after the first. */
async function startTimes(
  clock: FakeClock,
  urls: readonly string[]
): Promise<number[]> {
  const queue = createScryfallQueue(clock);
  const starts: number[] = [];
  const runs = urls.map((url) =>
    queue.schedule(url, async () => {
      starts.push(clock.now());
    })
  );
  await Promise.all(runs);
  return starts.map((start) => start - starts[0]);
}

describe("Scryfall request pacing", () => {
  it.each([...ENDPOINT_SPACING_MS.keys()])(
    "starts two requests to %s its own spacing apart",
    async (path) => {
      const url = `${SCRYFALL}${path}?q=sol`;

      expect(await startTimes(createFakeClock(), [url, url])).toEqual([
        0,
        spacingOf(path),
      ]);
    }
  );

  it("starts requests to different endpoints the minimum delay apart", async () => {
    expect(await startTimes(createFakeClock(), [SEARCH, NAMED])).toEqual([
      0,
      MIN_DELAY_MS,
    ]);
  });

  it("starts requests to other methods the minimum delay apart", async () => {
    expect(
      await startTimes(createFakeClock(), [CARD_BY_ID, CARD_BY_ID, CARD_BY_ID])
    ).toEqual([0, MIN_DELAY_MS, 2 * MIN_DELAY_MS]);
  });

  // The page lists each endpoint's limit on its own line, so a search does
  // not hold a named lookup back, nor a named lookup the next search.
  it("spaces a card endpoint from its own previous request only", async () => {
    expect(
      await startTimes(createFakeClock(), [SEARCH, NAMED, SEARCH])
    ).toEqual([0, MIN_DELAY_MS, spacingOf("/cards/search")]);
  });

  it("waits no further when the previous request itself outlasted the spacing", async () => {
    const clock = createFakeClock();
    const queue = createScryfallQueue(clock);
    const starts: number[] = [];
    const slow = queue.schedule(SEARCH, async () => {
      starts.push(clock.now());
      clock.advance(spacingOf("/cards/search") + 1);
    });
    const next = queue.schedule(SEARCH, async () => {
      starts.push(clock.now());
    });

    await Promise.all([slow, next]);
    expect(starts[1] - starts[0]).toBe(spacingOf("/cards/search") + 1);
  });

  it("keeps the line moving, and spaced, after a request rejects", async () => {
    const clock = createFakeClock();
    const queue = createScryfallQueue(clock);
    const starts: number[] = [];
    const failed = queue.schedule(CARD_BY_ID, async () => {
      starts.push(clock.now());
      throw new Error("network down");
    });
    const next = queue.schedule(CARD_BY_ID, async () => {
      starts.push(clock.now());
      return "served";
    });

    await expect(failed).rejects.toThrow("network down");
    await expect(next).resolves.toBe("served");
    expect(starts[1] - starts[0]).toBe(MIN_DELAY_MS);
  });

  it("forgets the last start times on reset", async () => {
    const clock = createFakeClock();
    const queue = createScryfallQueue(clock);
    const starts: number[] = [];
    const record = async (): Promise<void> => {
      starts.push(clock.now());
    };

    await queue.schedule(SEARCH, record);
    queue.reset();
    await queue.schedule(SEARCH, record);

    expect(starts[1] - starts[0]).toBe(0);
  });
});

/** Scryfall's 429 Too Many Requests, with a `Retry-After` header when one is given. */
function tooManyRequests(retryAfter?: string): Response {
  const headers = new Headers();
  if (retryAfter !== undefined) headers.set("Retry-After", retryAfter);
  return new Response(null, { status: 429, headers });
}

/** What became of a request: sent to Scryfall, or refused by a 429 block. */
type Outcome = "sent" | "refused";

/**
 * On a fresh queue, settles one search with `answer`, then says what becomes
 * of a request scheduled `offset` milliseconds later.
 */
async function outcomeAfter(
  answer: () => Promise<unknown>,
  offset: number
): Promise<Outcome> {
  const clock = createFakeClock();
  const queue = createScryfallQueue(clock);
  await queue.schedule(SEARCH, answer).catch(() => undefined);
  clock.advance(offset);
  return queue
    .schedule(CARD_BY_ID, async (): Promise<Outcome> => "sent")
    .catch((error: unknown): Outcome => {
      if (error instanceof ScryfallBlockedError) return "refused";
      throw error;
    });
}

/** `outcomeAfter` at each of `offsets`, each on its own queue. */
function outcomesAfter(
  answer: () => Promise<unknown>,
  offsets: readonly number[]
): Promise<Outcome[]> {
  return Promise.all(offsets.map((offset) => outcomeAfter(answer, offset)));
}

describe("after Scryfall answers 429", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses the next request without sending it, as a 429", async () => {
    const queue = createScryfallQueue(createFakeClock());
    const send = vi.fn(async () => "sent");

    await queue.schedule(SEARCH, async () => tooManyRequests());
    const next = queue.schedule(CARD_BY_ID, send);

    await expect(next).rejects.toBeInstanceOf(ScryfallApiError);
    await expect(next).rejects.toMatchObject({ status: 429 });
    expect(send).not.toHaveBeenCalled();
  });

  it("refuses the requests already waiting when the 429 lands, unsent", async () => {
    const queue = createScryfallQueue(createFakeClock());
    const send = vi.fn(async () => "sent");
    const answered = queue.schedule(SEARCH, async () => tooManyRequests());
    const waiting = [
      queue.schedule(SEARCH, send),
      queue.schedule(NAMED, send),
      queue.schedule(CARD_BY_ID, send),
    ];

    await answered;
    const settled = await Promise.allSettled(waiting);

    expect(settled.map((outcome) => outcome.status)).toEqual([
      "rejected",
      "rejected",
      "rejected",
    ]);
    expect(send).not.toHaveBeenCalled();
  });

  it("hands the 429 answer itself to its caller", async () => {
    const queue = createScryfallQueue(createFakeClock());
    const answer = tooManyRequests();

    await expect(queue.schedule(SEARCH, async () => answer)).resolves.toBe(
      answer
    );
  });

  it("sends again once Scryfall's 30 seconds have passed", async () => {
    expect(
      await outcomesAfter(
        async () => tooManyRequests(),
        [RATE_LIMIT_BLOCK_MS - 1, RATE_LIMIT_BLOCK_MS]
      )
    ).toEqual(["refused", "sent"]);
  });

  it("blocks for the seconds a Retry-After header gives", async () => {
    expect(
      await outcomesAfter(async () => tooManyRequests("5"), [4_999, 5_000])
    ).toEqual(["refused", "sent"]);
  });

  it.each(["soon", "-5", "2.5", "Thu, 26 Nov 2026 12:00:00 GMT"])(
    "falls back to 30 seconds for a Retry-After of %j",
    async (retryAfter) => {
      expect(
        await outcomesAfter(
          async () => tooManyRequests(retryAfter),
          [RATE_LIMIT_BLOCK_MS - 1, RATE_LIMIT_BLOCK_MS]
        )
      ).toEqual(["refused", "sent"]);
    }
  );

  it("caps a huge Retry-After at the longest block", async () => {
    expect(
      await outcomesAfter(
        async () => tooManyRequests("86400"),
        [MAX_RETRY_AFTER_MS - 1, MAX_RETRY_AFTER_MS]
      )
    ).toEqual(["refused", "sent"]);
  });

  it("blocks for 30 seconds after a request that fails with status 429, as httpGet throws it", async () => {
    const failure = async (): Promise<never> => {
      throw new HttpStatusError(429, "Source returned HTTP 429.");
    };

    expect(
      await outcomesAfter(failure, [
        RATE_LIMIT_BLOCK_MS - 1,
        RATE_LIMIT_BLOCK_MS,
      ])
    ).toEqual(["refused", "sent"]);
  });

  it.each([404, 503])("does not block after a %i", async (status) => {
    expect(
      await outcomesAfter(async () => new Response(null, { status }), [0])
    ).toEqual(["sent"]);
  });

  it("logs the 429 and the end of its block once, naming the endpoint path only", async () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    const start = 1_800_000_000_000;
    const queue = createScryfallQueue(createFakeClock(start));

    await queue.schedule(SEARCH, async () => tooManyRequests());
    await Promise.allSettled([
      queue.schedule(SEARCH, async () => "sent"),
      queue.schedule(NAMED, async () => "sent"),
    ]);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      endpoint: "/cards/search",
      blockedUntil: new Date(start + RATE_LIMIT_BLOCK_MS).toISOString(),
    });
  });

  it("forgets the block on reset", async () => {
    const queue = createScryfallQueue(createFakeClock());

    await queue.schedule(SEARCH, async () => tooManyRequests());
    queue.reset();

    await expect(queue.schedule(SEARCH, async () => "sent")).resolves.toBe(
      "sent"
    );
  });
});

describe("the default clock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("paces with Date.now and setTimeout", async () => {
    const queue = createScryfallQueue();
    const starts: number[] = [];
    const runs = [SEARCH, SEARCH].map((url) =>
      queue.schedule(url, async () => {
        starts.push(Date.now());
      })
    );

    await vi.runAllTimersAsync();
    await Promise.all(runs);
    expect(starts[1] - starts[0]).toBe(spacingOf("/cards/search"));
  });

  it("ends a 429 block by Date.now", async () => {
    const queue = createScryfallQueue();
    await queue.schedule(SEARCH, async () => tooManyRequests());

    const during = queue.schedule(CARD_BY_ID, async () => "sent");
    await expect(during).rejects.toBeInstanceOf(ScryfallBlockedError);
    vi.advanceTimersByTime(RATE_LIMIT_BLOCK_MS);
    const after = queue.schedule(CARD_BY_ID, async () => "sent");

    await expect(after).resolves.toBe("sent");
  });
});
