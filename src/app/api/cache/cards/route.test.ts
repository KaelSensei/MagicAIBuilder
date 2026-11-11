import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";
import { scryfallCacheDb } from "@/test/scryfall-cache-db-fake";

vi.mock("@/lib/db/prisma", async () => {
  const { scryfallCacheDb: db } = await import("@/test/scryfall-cache-db-fake");
  return { prisma: db.prisma };
});

import * as route from "./route";

const { GET } = route;
const table = scryfallCacheDb.cards;

const CARD_ID = "0000579f-7b35-4ed3-b44c-db2a538066fe";
const SOL_RING = { object: "card", id: CARD_ID, name: "Sol Ring" };

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

function lookup(id: string | null = CARD_ID): Promise<Response> {
  const query = id === null ? "" : `?id=${id}`;
  return GET(
    new Request(`http://localhost/api/cache/cards${query}`, {
      headers: { "x-real-ip": "203.0.113.8" },
    })
  );
}

function storedData(): unknown[] {
  return [...table.rows.values()].map((row) => row.data);
}

describe("/api/cache/cards — the server is the only writer", () => {
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
    const fetchMock = scryfallAnswers(SOL_RING);

    const response = await lookup();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hit: false, data: SOL_RING });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `https://api.scryfall.com/cards/${CARD_ID}`
    );
    expect(storedData()).toEqual([SOL_RING]);
  });

  it("serves the stored copy on the next read without asking Scryfall again", async () => {
    const fetchMock = scryfallAnswers(SOL_RING);
    await lookup();

    const response = await lookup();

    expect(await response.json()).toEqual({ hit: true, data: SOL_RING });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never serves a row stored under the old client-written key", async () => {
    table.rows.set(CARD_ID, {
      data: { ...SOL_RING, name: "Forged" },
      cachedAt: new Date(),
    });
    scryfallAnswers(SOL_RING);

    const response = await lookup();

    expect(await response.json()).toEqual({ hit: false, data: SOL_RING });
    expect(storedData()).toEqual([SOL_RING]);
  });

  it("does not store a card whose id is not the one asked for", async () => {
    scryfallAnswers({
      ...SOL_RING,
      id: "11111111-1111-4111-8111-111111111111",
    });

    const response = await lookup();

    expect(response.status).toBe(502);
    expect(table.rows.size).toBe(0);
  });

  it("answers 404 and stores nothing for a card Scryfall does not know", async () => {
    scryfallAnswers({ object: "error", status: 404 }, 404);

    const response = await lookup();

    expect(response.status).toBe(404);
    expect(table.rows.size).toBe(0);
  });

  it.each([
    ["no id", null],
    ["an id that is not a UUID", "not-a-uuid"],
    ["a UUID with trailing text", `${CARD_ID}x`],
  ])("rejects %s without reading the cache or Scryfall", async (_label, id) => {
    const fetchMock = scryfallAnswers(SOL_RING);
    const findUnique = vi.spyOn(table, "findUnique");

    const response = await lookup(id);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("GET /api/cache/cards — CDN caching", () => {
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

  it("lets the CDN keep a card the server just fetched for a day", async () => {
    scryfallAnswers(SOL_RING);

    const response = await lookup();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=86400, stale-while-revalidate=60"
    );
  });

  it("lets the CDN keep a card served from the shared cache for a day", async () => {
    scryfallAnswers(SOL_RING);
    await lookup();

    const response = await lookup();

    expect(await response.json()).toEqual({ hit: true, data: SOL_RING });
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=86400, stale-while-revalidate=60"
    );
  });

  it("keeps a rejected id out of the CDN", async () => {
    const response = await lookup("not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  // Vercel's CDN caches a 404 that carries s-maxage, so this guard matters.
  it("keeps a card Scryfall does not know out of the CDN", async () => {
    scryfallAnswers({ object: "error", status: 404 }, 404);

    const response = await lookup();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("keeps a failed Scryfall fetch out of the CDN", async () => {
    scryfallAnswers({ object: "error", details: "down" }, 503);

    const response = await lookup();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });
});

describe("GET /api/cache/cards request timing", () => {
  let info: ReturnType<typeof vi.spyOn>;

  function timingCalls() {
    return info.mock.calls.filter(
      ([message]) => message === "Card cache lookup completed"
    );
  }

  beforeEach(() => {
    scryfallCacheDb.reset();
    info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records a fresh hit", async () => {
    scryfallAnswers(SOL_RING);
    await lookup();
    info.mockClear();

    const body: unknown = await (await lookup()).json();

    expect(body).toEqual({ hit: true, data: SOL_RING });
    expect(timingCalls()).toEqual([
      [
        "Card cache lookup completed",
        "GET /api/cache/cards",
        { hit: true, failed: false, durationMs: expect.any(Number) },
      ],
    ]);
  });

  it("records a miss for an unknown card", async () => {
    scryfallAnswers(SOL_RING);

    await lookup();

    expect(timingCalls()).toEqual([
      [
        "Card cache lookup completed",
        "GET /api/cache/cards",
        { hit: false, failed: false, durationMs: expect.any(Number) },
      ],
    ]);
  });

  it("records an invalid id without querying the database", async () => {
    const findUnique = vi.spyOn(table, "findUnique");

    await lookup("not-a-uuid");

    expect(findUnique).not.toHaveBeenCalled();
    expect(timingCalls()).toHaveLength(1);
  });

  it("records a database failure as failed and still serves Scryfall's card", async () => {
    vi.spyOn(table, "findUnique").mockRejectedValueOnce(new Error("db down"));
    scryfallAnswers(SOL_RING);

    const body: unknown = await (await lookup()).json();

    expect(body).toEqual({ hit: false, data: SOL_RING });
    expect(timingCalls()[0]?.[2]).toEqual({
      hit: false,
      failed: true,
      durationMs: expect.any(Number),
    });
  });
});
