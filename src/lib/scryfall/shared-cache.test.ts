// @vitest-environment node
/**
 * Characterization of the shared Scryfall cache's read-through (master plan CC-01), pinned before
 * the catalog core moves to `modules/card-catalog` (CC-07).
 *
 * Sociable at the cache boundary: `readThrough` runs against the real `CARD_CACHE` table, whose
 * Prisma calls land in the in-memory stand-in of the cache tables (`scryfall-cache-db-fake.ts`,
 * through the `@/lib/db/prisma` seam), and fills from the real `fetchCard`, with MSW answering
 * Scryfall from the recorded fixtures. The fill budget is a parameter, so a stub stands in for
 * the rate limiter. Only `Date` is faked: the TTL boundary is exact while `fetch` keeps its real
 * timers.
 *
 * @module scryfall/shared-cache.test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  MAX_CARD_CACHE_BYTES,
  MAX_CARD_CACHE_ROWS,
  MAX_SEARCH_CACHE_BYTES,
  MAX_SEARCH_CACHE_ROWS,
} from "@/lib/cache-limits";
import { logger } from "@/lib/logger";
import { setupMsw } from "@/test/msw";
import { scryfallCacheDb } from "@/test/scryfall-cache-db-fake";
import { scryfallStandInHandlers } from "@/test/scryfall-stand-in";

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { scryfallCacheDb: db } = await import("@/test/scryfall-cache-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import { LIGHTNING_BOLT_NAMED_RECORDED } from "./fixtures/e2e-stand-in-v1";
import { fetchCard } from "./server-fetch";
import {
  CARD_CACHE,
  readThrough,
  SEARCH_CACHE,
  type FillSource,
  type SharedCache,
} from "./shared-cache";
import { cardCacheRowKey, SHARED_CACHE_NAMESPACE } from "./shared-cache-keys";
import type { ScryfallCard } from "./types";

const server = setupMsw(...scryfallStandInHandlers());

const BOLT = LIGHTNING_BOLT_NAMED_RECORDED;
const ROW_KEY = cardCacheRowKey(BOLT.id);
/** A well-formed id the stand-in has no card for. */
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000001";
/** The instant every read in this file happens at. */
const NOW = new Date("2026-11-13T12:00:00.000Z");
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

const table = scryfallCacheDb.cards;

const unlimited: FillSource<ScryfallCard>["allowFill"] = () => ({
  allowed: true,
});

/** The server's own Scryfall request for `id`, under the given fill budget. */
function fillFrom(
  id: string = BOLT.id,
  allowFill: FillSource<ScryfallCard>["allowFill"] = unlimited
): FillSource<ScryfallCard> {
  return { allowFill, fetchOwnCopy: () => fetchCard(id) };
}

function read(
  cache: SharedCache = CARD_CACHE,
  source: FillSource<ScryfallCard> = fillFrom()
) {
  return readThrough(cache, ROW_KEY, source);
}

/** Stores a row that was cached `ageMs` before now. */
function seed(rowKey: string, ageMs: number, data: unknown = BOLT): void {
  table.rows.set(rowKey, { data, cachedAt: new Date(NOW.getTime() - ageMs) });
}

/** The forged copy a test seeds, to tell a stored answer from a fetched one. */
const STORED_COPY = { ...BOLT, name: "Stored copy" };

describe("the shared caches", () => {
  it("keep a search page for an hour and a card for a day, within the shared row and byte limits", () => {
    expect(SEARCH_CACHE).toMatchObject({
      name: "search",
      ttlMs: ONE_HOUR_MS,
      maxBytes: MAX_SEARCH_CACHE_BYTES,
      maxRows: MAX_SEARCH_CACHE_ROWS,
    });
    expect(CARD_CACHE).toMatchObject({
      name: "cards",
      ttlMs: ONE_DAY_MS,
      maxBytes: MAX_CARD_CACHE_BYTES,
      maxRows: MAX_CARD_CACHE_ROWS,
    });
  });
});

describe("readThrough on the card cache", () => {
  beforeEach(() => {
    scryfallCacheDb.reset();
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("serves a fresh row as stored, without asking Scryfall", async () => {
    seed(ROW_KEY, 0, STORED_COPY);
    const fetchOwnCopy = vi.fn(() => fetchCard(BOLT.id));

    const result = await read(CARD_CACHE, {
      allowFill: unlimited,
      fetchOwnCopy,
    });

    expect(result).toEqual({
      outcome: { kind: "hit", data: STORED_COPY },
      dbFailed: false,
    });
    expect(fetchOwnCopy).not.toHaveBeenCalled();
  });

  it("fills a miss with the server's own copy and stores it under now", async () => {
    const result = await read();

    expect(result).toEqual({
      outcome: { kind: "filled", data: BOLT },
      dbFailed: false,
    });
    expect(table.rows.get(ROW_KEY)).toEqual({ data: BOLT, cachedAt: NOW });
  });

  it("still serves a row aged exactly the TTL", async () => {
    seed(ROW_KEY, CARD_CACHE.ttlMs, STORED_COPY);

    const result = await read();

    expect(result.outcome).toEqual({ kind: "hit", data: STORED_COPY });
  });

  it("refetches a row one millisecond past the TTL and replaces it", async () => {
    seed(ROW_KEY, CARD_CACHE.ttlMs + 1, STORED_COPY);

    const result = await read();

    expect(result.outcome).toEqual({ kind: "filled", data: BOLT });
    expect(table.rows.get(ROW_KEY)).toEqual({ data: BOLT, cachedAt: NOW });
  });

  it("prunes the expired rows and the rows outside the namespace when it stores a fill", async () => {
    seed(`${SHARED_CACHE_NAMESPACE}expired`, CARD_CACHE.ttlMs + 1);
    seed(`${SHARED_CACHE_NAMESPACE}at-the-ttl`, CARD_CACHE.ttlMs);
    seed(`${SHARED_CACHE_NAMESPACE}fresh`, 1000);
    seed("client-written-key", 0);

    await read();

    expect([...table.rows.keys()].sort()).toEqual(
      [
        `${SHARED_CACHE_NAMESPACE}at-the-ttl`,
        `${SHARED_CACHE_NAMESPACE}fresh`,
        ROW_KEY,
      ].sort()
    );
  });

  it("passes a card Scryfall does not know on as not_found and stores nothing", async () => {
    const result = await read(CARD_CACHE, fillFrom(UNKNOWN_ID));

    expect(result).toEqual({ outcome: { kind: "not_found" }, dbFailed: false });
    expect(table.rows.size).toBe(0);
  });

  it("reports a failed fill with Scryfall's status in the log and stores nothing", async () => {
    server.use(
      http.get("*/cards/:id", () =>
        HttpResponse.json(
          { object: "error", code: "failed", status: 503 },
          { status: 503 }
        )
      )
    );

    const result = await read();

    expect(result).toEqual({
      outcome: { kind: "upstream_failed" },
      dbFailed: false,
    });
    expect(table.rows.size).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      "Scryfall fill failed",
      "Shared Scryfall cache",
      { cache: "cards", status: 503 }
    );
  });

  it("throttles a miss the fill budget refuses, without asking Scryfall", async () => {
    const fetchOwnCopy = vi.fn(() => fetchCard(BOLT.id));

    const result = await read(CARD_CACHE, {
      allowFill: () => ({ allowed: false, retryAfterMs: 1234 }),
      fetchOwnCopy,
    });

    expect(result).toEqual({
      outcome: { kind: "throttled", retryAfterMs: 1234 },
      dbFailed: false,
    });
    expect(fetchOwnCopy).not.toHaveBeenCalled();
    expect(table.rows.size).toBe(0);
  });

  it("fills from Scryfall when the read fails, says so, and still stores the copy", async () => {
    vi.spyOn(table, "findUnique").mockRejectedValueOnce(new Error("db down"));

    const result = await read();

    expect(result).toEqual({
      outcome: { kind: "filled", data: BOLT },
      dbFailed: true,
    });
    expect(table.rows.get(ROW_KEY)).toEqual({ data: BOLT, cachedAt: NOW });
    expect(logger.error).toHaveBeenCalledWith(
      "db down",
      "Shared Scryfall cache",
      { cache: "cards", step: "read" }
    );
  });

  it("serves the copy unstored when the write fails, and says so", async () => {
    vi.spyOn(table, "upsert").mockRejectedValueOnce(new Error("disk full"));

    const result = await read();

    expect(result).toEqual({
      outcome: { kind: "filled", data: BOLT },
      dbFailed: true,
    });
    expect(table.rows.size).toBe(0);
    expect(logger.error).toHaveBeenCalledWith(
      "disk full",
      "Shared Scryfall cache",
      { cache: "cards", step: "write" }
    );
  });

  it("serves but does not store a fill once the table holds its row cap", async () => {
    seed(`${SHARED_CACHE_NAMESPACE}other`, 0);
    const oneRowCache: SharedCache = { ...CARD_CACHE, maxRows: 1 };

    const result = await read(oneRowCache);

    expect(result.outcome).toEqual({ kind: "filled", data: BOLT });
    expect([...table.rows.keys()]).toEqual([`${SHARED_CACHE_NAMESPACE}other`]);
  });

  it("serves but does not store a fill larger than the byte cap, and prunes nothing", async () => {
    seed(`${SHARED_CACHE_NAMESPACE}expired`, CARD_CACHE.ttlMs + 1);
    const tinyCache: SharedCache = { ...CARD_CACHE, maxBytes: 16 };

    const result = await read(tinyCache);

    expect(result).toEqual({
      outcome: { kind: "filled", data: BOLT },
      dbFailed: false,
    });
    expect([...table.rows.keys()]).toEqual([
      `${SHARED_CACHE_NAMESPACE}expired`,
    ]);
  });
});
