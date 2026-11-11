/**
 * The shared Scryfall cache, read through on the server.
 *
 * A fresh row is served as stored. On a miss, or a row past its TTL, the server
 * fetches Scryfall itself, stores its own copy and serves it. No client body is
 * ever stored: there is no write path but this one.
 *
 * Every write first prunes expired rows and rows outside the current key
 * namespace (those written before the server was the only writer), then
 * refuses to add a row once the table holds its cap. A page too large to store
 * is still served. Two concurrent fills may each pass the count, so the cap is
 * soft by a few rows.
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toJsonPayload } from "@/lib/api/json-payload";
import { logger } from "@/lib/logger";
import type { checkRateLimit } from "@/lib/rate-limit";
import {
  MAX_CARD_CACHE_BYTES,
  MAX_CARD_CACHE_ROWS,
  MAX_SEARCH_CACHE_BYTES,
  MAX_SEARCH_CACHE_ROWS,
} from "@/lib/cache-limits";
import { SHARED_CACHE_NAMESPACE } from "./shared-cache-keys";
import type { UpstreamResult } from "./server-fetch";

const LOG_CONTEXT = "Shared Scryfall cache";

type CachedRow = { readonly data: Prisma.JsonValue; readonly cachedAt: Date };

/** The calls the read-through makes on one cache table. */
type CacheTable = {
  readonly find: (rowKey: string) => Promise<CachedRow | null>;
  readonly save: (
    rowKey: string,
    data: Prisma.InputJsonValue,
    cachedAt: Date
  ) => Promise<void>;
  /** Deletes rows cached before `expiredBefore` and rows outside the namespace. */
  readonly prune: (expiredBefore: Date) => Promise<void>;
  readonly count: () => Promise<number>;
};

/** One shared cache: where its rows live and how they are bounded. */
export type SharedCache = {
  readonly name: "search" | "cards";
  readonly table: CacheTable;
  readonly ttlMs: number;
  readonly maxBytes: number;
  readonly maxRows: number;
};

/** Search pages, keyed `srv1:<sha256>`, kept 1 h. */
export const SEARCH_CACHE: SharedCache = {
  name: "search",
  ttlMs: 60 * 60 * 1000,
  maxBytes: MAX_SEARCH_CACHE_BYTES,
  maxRows: MAX_SEARCH_CACHE_ROWS,
  table: {
    find: (cacheKey) =>
      prisma.scryfallSearchCache.findUnique({
        where: { cacheKey },
        select: { data: true, cachedAt: true },
      }),
    save: async (cacheKey, data, cachedAt) => {
      await prisma.scryfallSearchCache.upsert({
        where: { cacheKey },
        create: { cacheKey, data, cachedAt },
        update: { data, cachedAt },
      });
    },
    prune: async (expiredBefore) => {
      await prisma.scryfallSearchCache.deleteMany({
        where: {
          OR: [
            { cachedAt: { lt: expiredBefore } },
            { NOT: { cacheKey: { startsWith: SHARED_CACHE_NAMESPACE } } },
          ],
        },
      });
    },
    count: () => prisma.scryfallSearchCache.count(),
  },
};

/** Cards by Scryfall id, keyed `srv1:<id>`, kept 24 h. */
export const CARD_CACHE: SharedCache = {
  name: "cards",
  ttlMs: 24 * 60 * 60 * 1000,
  maxBytes: MAX_CARD_CACHE_BYTES,
  maxRows: MAX_CARD_CACHE_ROWS,
  table: {
    find: (scryfallId) =>
      prisma.cardCache.findUnique({
        where: { scryfallId },
        select: { data: true, cachedAt: true },
      }),
    save: async (scryfallId, data, cachedAt) => {
      await prisma.cardCache.upsert({
        where: { scryfallId },
        create: { scryfallId, data, cachedAt },
        update: { data, cachedAt },
      });
    },
    prune: async (expiredBefore) => {
      await prisma.cardCache.deleteMany({
        where: {
          OR: [
            { cachedAt: { lt: expiredBefore } },
            { NOT: { scryfallId: { startsWith: SHARED_CACHE_NAMESPACE } } },
          ],
        },
      });
    },
    count: () => prisma.cardCache.count(),
  },
};

/** How a read ended, for the route to turn into a response. */
export type ReadThroughOutcome<T> =
  | { readonly kind: "hit"; readonly data: Prisma.JsonValue }
  | { readonly kind: "filled"; readonly data: T }
  | { readonly kind: "throttled"; readonly retryAfterMs: number }
  | { readonly kind: "not_found" }
  | { readonly kind: "upstream_failed" };

/** A read's outcome, and whether a database call failed along the way. */
export type ReadThrough<T> = {
  readonly outcome: ReadThroughOutcome<T>;
  readonly dbFailed: boolean;
};

/** Where a miss is filled from, and who may cause one. */
export type FillSource<T> = {
  /** Spends one unit of the caller's fill budget; called only on a miss. */
  readonly allowFill: () => ReturnType<typeof checkRateLimit>;
  /** The server's own request to Scryfall. */
  readonly fetchOwnCopy: () => Promise<UpstreamResult<T>>;
};

function logDbError(
  cache: SharedCache,
  step: "read" | "write",
  error: unknown
): void {
  logger.error(
    error instanceof Error ? error.message : "unknown",
    LOG_CONTEXT,
    { cache: cache.name, step }
  );
}

async function readFresh(
  cache: SharedCache,
  rowKey: string,
  now: Date
): Promise<CachedRow | null> {
  const row = await cache.table.find(rowKey);
  if (row === null) return null;
  return now.getTime() - row.cachedAt.getTime() <= cache.ttlMs ? row : null;
}

async function storeOwnCopy(
  cache: SharedCache,
  rowKey: string,
  value: unknown,
  now: Date
): Promise<void> {
  const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  if (bytes > cache.maxBytes) return;
  await cache.table.prune(new Date(now.getTime() - cache.ttlMs));
  if ((await cache.table.count()) >= cache.maxRows) return;
  await cache.table.save(rowKey, toJsonPayload(value), now);
}

/**
 * Serves one entry of a shared cache, filling a miss from Scryfall.
 *
 * A database failure never fails the read: the entry is then fetched from
 * Scryfall and served unstored, and `dbFailed` says so.
 *
 * @param cache - the cache to read
 * @param rowKey - the entry's namespaced row key
 * @param source - the fill budget and the server's Scryfall request
 * @returns the outcome, and whether a database call failed
 */
export async function readThrough<T>(
  cache: SharedCache,
  rowKey: string,
  source: FillSource<T>
): Promise<ReadThrough<T>> {
  const now = new Date();
  let dbFailed = false;
  try {
    const row = await readFresh(cache, rowKey, now);
    if (row) return { outcome: { kind: "hit", data: row.data }, dbFailed };
  } catch (error) {
    dbFailed = true;
    logDbError(cache, "read", error);
  }

  const budget = source.allowFill();
  if (!budget.allowed) {
    return {
      outcome: { kind: "throttled", retryAfterMs: budget.retryAfterMs },
      dbFailed,
    };
  }

  const upstream = await source.fetchOwnCopy();
  if (upstream.kind === "not_found") return { outcome: upstream, dbFailed };
  if (upstream.kind === "failed") {
    logger.warn("Scryfall fill failed", LOG_CONTEXT, {
      cache: cache.name,
      status: upstream.status,
    });
    return { outcome: { kind: "upstream_failed" }, dbFailed };
  }

  try {
    await storeOwnCopy(cache, rowKey, upstream.data, now);
  } catch (error) {
    dbFailed = true;
    logDbError(cache, "write", error);
  }
  return { outcome: { kind: "filled", data: upstream.data }, dbFailed };
}
