import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import {
  MAX_SEARCH_CACHE_BYTES,
  MAX_SEARCH_CACHE_ROWS,
} from "@/lib/cache-limits";
import { SHARED_CACHE_NAMESPACE } from "@/lib/scryfall/shared-cache-keys";
import { scryfallCacheDb } from "@/test/scryfall-cache-db-fake";

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { scryfallCacheDb: db } = await import("@/test/scryfall-cache-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import * as route from "./route";

const { GET } = route;
const table = scryfallCacheDb.search;

/** A page as Scryfall serves it. */
function scryfallPage(...names: readonly string[]) {
  return {
    object: "list",
    total_cards: names.length,
    has_more: false,
    data: names.map((name, index) => ({
      object: "card",
      id: `00000000-0000-4000-8000-00000000000${index}`,
      name,
    })),
  };
}

const GAME_CHANGERS = scryfallPage("Cyclonic Rift", "Rhystic Study");

/** Stubs api.scryfall.com with one answer for every request. */
function scryfallAnswers(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function read(params: Record<string, string>, ip = "203.0.113.7") {
  const search = new URLSearchParams(params);
  return GET(
    new Request(`http://localhost/api/cache/search?${search}`, {
      headers: { "x-real-ip": ip },
    })
  );
}

function storedData(): unknown[] {
  return [...table.rows.values()].map((row) => row.data);
}

describe("/api/cache/search — the server is the only writer", () => {
  beforeEach(() => {
    scryfallCacheDb.reset();
    vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("has no write handler, so a client's body never becomes a stored entry", () => {
    // Next.js answers 405 for every method a route module does not export.
    expect(route).not.toHaveProperty("POST");
    expect(route).not.toHaveProperty("PUT");
    expect(route).not.toHaveProperty("PATCH");
    expect(route).not.toHaveProperty("DELETE");
  });

  it("fills a miss with one Scryfall request of its own and stores that copy", async () => {
    const fetchMock = scryfallAnswers(GAME_CHANGERS);

    const response = await read({ query: "is:gamechanger", page: "1" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hit: false, data: GAME_CHANGERS });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const sent = new URL(String(url));
    expect(sent.origin + sent.pathname).toBe(
      "https://api.scryfall.com/cards/search"
    );
    expect(sent.searchParams.get("q")).toBe("is:gamechanger");
    expect(sent.searchParams.get("page")).toBe("1");
    expect(sent.searchParams.get("order")).toBe("edhrec");
    expect(new Headers(init?.headers).get("User-Agent")).toMatch(
      /^MagicAIBuilder\//
    );
    expect(storedData()).toEqual([GAME_CHANGERS]);
  });

  it("serves the stored copy on the next read without asking Scryfall again", async () => {
    const fetchMock = scryfallAnswers(GAME_CHANGERS);
    await read({ query: "is:gamechanger", page: "1" });

    const response = await read({ query: "is:gamechanger", page: "1" });

    expect(await response.json()).toEqual({ hit: true, data: GAME_CHANGERS });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never serves a row stored under the old client-written key", async () => {
    const forged = scryfallPage("Forged");
    const legacyKey = createHash("sha256")
      .update("is:gamechanger|1")
      .digest("hex");
    table.rows.set(legacyKey, { data: forged, cachedAt: new Date() });
    scryfallAnswers(GAME_CHANGERS);

    const response = await read({ query: "is:gamechanger", page: "1" });

    expect(await response.json()).toEqual({ hit: false, data: GAME_CHANGERS });
    expect(storedData()).toEqual([GAME_CHANGERS]);
  });

  it("refreshes a row older than an hour from Scryfall", async () => {
    scryfallAnswers(GAME_CHANGERS);
    await read({ query: "is:gamechanger", page: "1" });
    const [key] = [...table.rows.keys()];
    table.rows.set(String(key), {
      data: scryfallPage("Old"),
      cachedAt: new Date(0),
    });

    const response = await read({ query: "is:gamechanger", page: "1" });

    expect(await response.json()).toEqual({ hit: false, data: GAME_CHANGERS });
    expect(storedData()).toEqual([GAME_CHANGERS]);
  });

  it("keeps multilingual results under their own key and asks Scryfall for them", async () => {
    const fetchMock = scryfallAnswers(GAME_CHANGERS);

    await read({ query: "is:gamechanger lang:fr", page: "1" });
    await read({
      query: "is:gamechanger lang:fr",
      page: "1",
      multilingual: "1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const second = new URL(String(fetchMock.mock.calls[1]?.[0]));
    expect(second.searchParams.get("include_multilingual")).toBe("true");
    expect(table.rows.size).toBe(2);
  });

  it.each([
    ["no query", {}],
    ["an empty query", { query: "" }],
    ["a query over 1000 characters", { query: "x".repeat(1001) }],
    ["a control character", { query: "t:goblin\u0000" }],
    ["a line break", { query: "t:goblin\nt:elf" }],
    ["page 0", { query: "t:goblin", page: "0" }],
    ["a page past 100", { query: "t:goblin", page: "101" }],
    ["a page that is not a whole number", { query: "t:goblin", page: "1.5" }],
    [
      "an unknown multilingual flag",
      { query: "t:goblin", multilingual: "yes" },
    ],
  ])(
    "rejects %s without reading the cache or Scryfall",
    async (_label, params) => {
      const fetchMock = scryfallAnswers(GAME_CHANGERS);
      const findUnique = vi.spyOn(table, "findUnique");

      const response = await read(params);

      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(findUnique).not.toHaveBeenCalled();
    }
  );

  it("returns a page over the payload cap but does not store it", async () => {
    const huge = scryfallPage("Huge");
    huge.data[0] = {
      ...huge.data[0],
      name: "x".repeat(MAX_SEARCH_CACHE_BYTES),
    };
    scryfallAnswers(huge);

    const response = await read({ query: "t:huge", page: "1" });

    expect(await response.json()).toEqual({ hit: false, data: huge });
    expect(table.rows.size).toBe(0);
  });

  it("answers 502 and stores nothing when Scryfall fails", async () => {
    scryfallAnswers({ object: "error", details: "down" }, 503);

    const response = await read({ query: "t:goblin", page: "1" });

    expect(response.status).toBe(502);
    expect(table.rows.size).toBe(0);
  });

  it("stores Scryfall's answer to a valid query with no match as an empty page", async () => {
    scryfallAnswers(
      { object: "error", status: 404, details: "No cards found" },
      404
    );

    const response = await read({ query: "t:nothing", page: "1" });

    expect(await response.json()).toEqual({
      hit: false,
      data: { object: "list", total_cards: 0, has_more: false, data: [] },
    });
  });

  it("does not store a body that is not a Scryfall list", async () => {
    scryfallAnswers({ object: "card", name: "Not a list" });

    const response = await read({ query: "t:goblin", page: "1" });

    expect(response.status).toBe(502);
    expect(table.rows.size).toBe(0);
  });

  it("adds no row once the table holds its cap of unexpired rows, and still serves the page", async () => {
    for (let index = 0; index < MAX_SEARCH_CACHE_ROWS; index += 1) {
      table.rows.set(`${SHARED_CACHE_NAMESPACE}seed-${index}`, {
        data: {},
        cachedAt: new Date(),
      });
    }
    scryfallAnswers(GAME_CHANGERS);

    const response = await read({ query: "is:gamechanger", page: "1" });

    expect(await response.json()).toEqual({ hit: false, data: GAME_CHANGERS });
    expect(table.rows.size).toBe(MAX_SEARCH_CACHE_ROWS);
    expect(storedData()).not.toContainEqual(GAME_CHANGERS);
  });

  it("frees expired rows before it counts against the cap", async () => {
    for (let index = 0; index < MAX_SEARCH_CACHE_ROWS; index += 1) {
      table.rows.set(`${SHARED_CACHE_NAMESPACE}seed-${index}`, {
        data: {},
        cachedAt: new Date(0),
      });
    }
    scryfallAnswers(GAME_CHANGERS);

    await read({ query: "is:gamechanger", page: "1" });

    expect(storedData()).toEqual([GAME_CHANGERS]);
  });

  it("limits how many misses one client IP can make the server fill", async () => {
    const fetchMock = scryfallAnswers(GAME_CHANGERS);
    const ip = "198.51.100.60";
    for (let index = 0; index < 60; index += 1) {
      await read({ query: `t:goblin cmc=${index}` }, ip);
    }

    const throttled = await read({ query: "t:goblin cmc=60" }, ip);
    const stored = await read({ query: "t:goblin cmc=0" }, ip);

    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(await stored.json()).toEqual({ hit: true, data: GAME_CHANGERS });
    expect(fetchMock).toHaveBeenCalledTimes(60);
  });
});

describe("GET /api/cache/search — CDN caching", () => {
  beforeEach(() => {
    scryfallCacheDb.reset();
    vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lets the CDN keep a page the server just fetched for an hour", async () => {
    scryfallAnswers(GAME_CHANGERS);

    const response = await read({ query: "is:gamechanger", page: "1" });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=60"
    );
  });

  it("lets the CDN keep a page served from the shared cache for an hour", async () => {
    scryfallAnswers(GAME_CHANGERS);
    await read({ query: "is:gamechanger", page: "1" });

    const response = await read({ query: "is:gamechanger", page: "1" });

    expect(await response.json()).toEqual({ hit: true, data: GAME_CHANGERS });
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=60"
    );
  });

  it("keeps a rejected query out of the CDN", async () => {
    const response = await read({ query: "" });

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("keeps a throttled fill out of the CDN", async () => {
    scryfallAnswers(GAME_CHANGERS);
    const ip = "198.51.100.61";
    for (let index = 0; index < 60; index += 1) {
      await read({ query: `t:elf cmc=${index}` }, ip);
    }

    const response = await read({ query: "t:elf cmc=60" }, ip);

    expect(response.status).toBe(429);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("keeps a failed Scryfall fetch out of the CDN", async () => {
    scryfallAnswers({ object: "error", details: "down" }, 503);

    const response = await read({ query: "t:goblin", page: "1" });

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });
});

describe("GET /api/cache/search — request logging", () => {
  beforeEach(() => {
    scryfallCacheDb.reset();
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records cache misses without logging the search query", async () => {
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    scryfallAnswers(GAME_CHANGERS);

    const response = await read({ query: "private deck idea" });

    expect(response.status).toBe(200);
    expect(log).toHaveBeenCalledWith(
      "Scryfall search cache lookup completed",
      "GET /api/cache/search",
      { hit: false, failed: false, durationMs: expect.any(Number) }
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("private deck idea");
  });

  it("records cache hits without logging the cached data", async () => {
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    scryfallAnswers(scryfallPage("Private Pick"));
    await read({ query: "private deck idea" });
    log.mockClear();

    const response = await read({ query: "private deck idea" });

    expect(await response.json()).toEqual({
      hit: true,
      data: scryfallPage("Private Pick"),
    });
    expect(log).toHaveBeenCalledWith(
      "Scryfall search cache lookup completed",
      "GET /api/cache/search",
      { hit: true, failed: false, durationMs: expect.any(Number) }
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("Private Pick");
  });

  it("serves Scryfall's page and records the failure when the database is down", async () => {
    const log = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    vi.spyOn(table, "findUnique").mockRejectedValue(
      new Error("database unavailable")
    );
    vi.spyOn(table, "upsert").mockRejectedValue(
      new Error("database unavailable")
    );
    scryfallAnswers(GAME_CHANGERS);

    const response = await read({ query: "private deck idea" });

    expect(await response.json()).toEqual({ hit: false, data: GAME_CHANGERS });
    expect(log).toHaveBeenCalledWith(
      "Scryfall search cache lookup completed",
      "GET /api/cache/search",
      { hit: false, failed: true, durationMs: expect.any(Number) }
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("private deck idea");
  });
});
