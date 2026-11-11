import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScryfallQueue } from "./request-queue";

const CARD_BY_ID =
  "https://api.scryfall.com/cards/0000579f-7b35-4ed3-b44c-db2a538066fe";

/**
 * Sends `urls` through a fresh paced queue, all scheduled at once, and
 * returns when each request started, in milliseconds after the first.
 */
async function startTimes(urls: readonly string[]): Promise<number[]> {
  const queue = createScryfallQueue({ paced: true });
  const starts: number[] = [];
  const runs = urls.map((url) =>
    queue.schedule(url, async () => {
      starts.push(Date.now());
    })
  );
  await vi.runAllTimersAsync();
  await Promise.all(runs);
  return starts.map((start) => start - starts[0]);
}

describe("Scryfall request pacing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts requests to other methods 100 ms apart", async () => {
    expect(await startTimes([CARD_BY_ID, CARD_BY_ID, CARD_BY_ID])).toEqual([
      0, 100, 200,
    ]);
  });
});
