import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import { ScryfallApiError } from "./api-error";
import { SCRYFALL_API } from "./constants";
import { scheduleScryfallRequest } from "./request-queue";
import { getCardRulings, RULINGS_TIMEOUT_MS } from "./rulings";

const SCRYFALL_RESPONSE = {
  object: "list",
  data: [
    {
      object: "ruling",
      oracle_id: "oracle-1",
      source: "wotc",
      published_at: "2024-01-12",
      comment: "This is the current ruling.",
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("getCardRulings", () => {
  it("returns previously viewed rulings when the network is unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(SCRYFALL_RESPONSE), { status: 200 })
      )
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const onlineResult = await getCardRulings("card-1");
    const offlineResult = await getCardRulings("card-1");

    expect(onlineResult.source).toBe("network");
    expect(offlineResult).toEqual({
      source: "cache",
      rulings: onlineResult.rulings,
    });
  });

  it("bounds the Scryfall request with a 15 second timeout signal", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(SCRYFALL_RESPONSE), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await getCardRulings("card-timeout");

    expect(RULINGS_TIMEOUT_MS).toBe(15_000);
    expect(timeoutSpy).toHaveBeenCalledWith(RULINGS_TIMEOUT_MS);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/cards/card-timeout/rulings"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    timeoutSpy.mockRestore();
  });

  it("falls back to cached rulings when a later request times out", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(SCRYFALL_RESPONSE), { status: 200 }))
      .mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"));
    vi.stubGlobal("fetch", fetchMock);

    const online = await getCardRulings("card-slow");
    const result = await getCardRulings("card-slow");

    expect(result).toEqual({ source: "cache", rulings: online.rulings });
  });

  it("rejects a timed-out request when nothing is cached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"))
    );

    await expect(getCardRulings("card-uncached")).rejects.toThrow("Unable to load card rulings");
  });
});

/** Another Scryfall request of this runtime, ahead of the rulings in the queue. */
const OTHER_REQUEST = `${SCRYFALL_API}/cards/search?q=sol`;

/** Has Scryfall answer another request of this runtime with 429, which starts the queue's block. */
async function startScryfallBlock(): Promise<void> {
  await scheduleScryfallRequest(
    OTHER_REQUEST,
    async () => new Response(null, { status: 429 })
  );
}

/** Rulings Scryfall answers successfully. */
function rulingsAnswer(): Response {
  return new Response(JSON.stringify(SCRYFALL_RESPONSE), { status: 200 });
}

describe("getCardRulings in the runtime's Scryfall queue", () => {
  beforeEach(() => {
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses the request during a 429 block without calling fetch, as a 429", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    await startScryfallBlock();

    const refused = getCardRulings("card-blocked");

    await expect(refused).rejects.toBeInstanceOf(ScryfallApiError);
    await expect(refused).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serves the offline copy during a 429 block without calling fetch", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(rulingsAnswer());
    vi.stubGlobal("fetch", fetchMock);
    const online = await getCardRulings("card-1");
    await startScryfallBlock();

    await expect(getCardRulings("card-1")).resolves.toEqual({
      source: "cache",
      rulings: online.rulings,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("starts the block when Scryfall answers the rulings with 429", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getCardRulings("card-429")).rejects.toThrow("429");

    await expect(getCardRulings("card-429")).rejects.toMatchObject({
      status: 429,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("starts its timeout only when its turn comes, after the request ahead of it", async () => {
    const events: string[] = [];
    vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
      events.push(`timeout of ${ms} ms`);
      return new AbortController().signal;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(rulingsAnswer())
    );
    const ahead = scheduleScryfallRequest(OTHER_REQUEST, async () => {
      events.push("request ahead");
    });

    await getCardRulings("card-waiting");
    await ahead;

    expect(events).toEqual([
      "request ahead",
      `timeout of ${RULINGS_TIMEOUT_MS} ms`,
    ]);
  });
});
