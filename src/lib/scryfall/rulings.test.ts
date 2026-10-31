import { beforeEach, describe, expect, it, vi } from "vitest";
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
