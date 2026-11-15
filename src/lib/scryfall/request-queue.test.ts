/**
 * Spacing of the Scryfall request queue, measured on an injected clock.
 *
 * Each expectation is read from the queue's own constants (`MIN_DELAY_MS`,
 * `ENDPOINT_SPACING_MS`), never from a number typed here: the Scryfall limits
 * the constants cite (https://scryfall.com/docs/api/rate-limits, read
 * 2026-11-10) are documented on the constants, and this suite pins that the
 * queue applies them. The queue runs on a fake clock whose `sleep` moves time
 * forward, so no timer and no real wait is involved; one test drives the
 * default wall clock with Vitest fake timers to pin that wiring.
 *
 * @module scryfall/request-queue.test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createScryfallQueue,
  ENDPOINT_SPACING_MS,
  MIN_DELAY_MS,
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
});
