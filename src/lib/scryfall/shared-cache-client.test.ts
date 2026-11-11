import { describe, it, expect, vi, afterEach } from "vitest";
import {
  lookupCardCache,
  lookupSearchCache,
} from "@/lib/scryfall/shared-cache-client";

function mockFetch(data: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      json: async () => data,
    })
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lookupCardCache", () => {
  it("returns null when the answer carries no data", async () => {
    mockFetch({ hit: false }, true, 200);
    const result = await lookupCardCache("missing-id");
    expect(result).toBeNull();
  });

  it("returns data when cache hit", async () => {
    mockFetch(
      { hit: true, data: { id: "card-1", name: "Sol Ring" } },
      true,
      200
    );
    const result = await lookupCardCache("card-1");
    expect(result).toEqual({ id: "card-1", name: "Sol Ring" });
  });

  it("returns data the server has just fetched to fill a miss", async () => {
    mockFetch(
      { hit: false, data: { id: "card-1", name: "Sol Ring" } },
      true,
      200
    );
    const result = await lookupCardCache("card-1");
    expect(result).toEqual({ id: "card-1", name: "Sol Ring" });
  });

  it("returns null on fetch error", async () => {
    mockFetch(null, false, 500);
    const result = await lookupCardCache("error-id");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error"))
    );
    const result = await lookupCardCache("any-id");
    expect(result).toBeNull();
  });
});

describe("lookupSearchCache", () => {
  it("reads the page through the search cache route", async () => {
    mockFetch({ hit: false, data: { object: "list", data: [] } });
    const result = await lookupSearchCache("t:goblin", 2);
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe("/api/cache/search?query=t%3Agoblin&page=2");
    expect(call[1]).toBeUndefined();
    expect(result).toEqual({ object: "list", data: [] });
  });

  it("asks for multilingual results when told to", async () => {
    mockFetch({ hit: true, data: {} });
    await lookupSearchCache("lang:fr t:goblin", 1, true);
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("multilingual=1");
  });

  it("returns null when the server cannot answer", async () => {
    mockFetch({ error: "Scryfall did not answer" }, false, 502);
    await expect(lookupSearchCache("t:goblin", 1)).resolves.toBeNull();
  });
});
