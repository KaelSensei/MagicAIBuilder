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

  // https://scryfall.com/docs/api/rate-limits (read 2026-11-10): 2 per second.
  it.each([
    "https://api.scryfall.com/cards/search?q=sol",
    "https://api.scryfall.com/cards/named?exact=Sol%20Ring",
    "https://api.scryfall.com/cards/random",
    "https://api.scryfall.com/cards/collection",
  ])("starts two requests to %s 500 ms apart", async (url) => {
    expect(await startTimes([url, url])).toEqual([0, 500]);
  });

  it("starts two /cards/manifest requests 6 seconds apart", async () => {
    const manifest = "https://api.scryfall.com/cards/manifest";

    expect(await startTimes([manifest, manifest])).toEqual([0, 6_000]);
  });

  // The page lists each endpoint's limit on its own line, so a search does
  // not hold a named lookup back, nor a named lookup the next search.
  it("spaces a card endpoint from its own previous request only", async () => {
    const search = "https://api.scryfall.com/cards/search?q=sol";
    const named = "https://api.scryfall.com/cards/named?exact=Sol%20Ring";

    expect(await startTimes([search, named, search])).toEqual([0, 100, 500]);
  });

  it("starts requests to other methods 100 ms apart", async () => {
    expect(await startTimes([CARD_BY_ID, CARD_BY_ID, CARD_BY_ID])).toEqual([
      0, 100, 200,
    ]);
  });
});
