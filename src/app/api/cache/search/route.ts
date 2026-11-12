import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  parseSearchCacheKey,
  searchCacheRowKey,
} from "@/lib/scryfall/shared-cache-keys";
import { fetchSearchPage } from "@/lib/scryfall/server-fetch";
import { readThrough, SEARCH_CACHE } from "@/lib/scryfall/shared-cache";
import { readThroughResponse } from "../read-through-response";

const FILL_RATE_LIMIT = 60; // max Scryfall fills
const FILL_RATE_WINDOW = 60_000; // per 60 seconds per client IP

/**
 * GET /api/cache/search?query=<string>&page=<1-100>&multilingual=1
 *
 * Read-through: serves the stored page, or fetches it from Scryfall, stores the
 * server's own copy and serves that. The route has no write handler, so
 * Next.js answers 405 to a POST: no client body can become a shared entry.
 */
export async function GET(request: Request): Promise<Response> {
  const startedAt = performance.now();
  let hit = false;
  let failed = false;
  try {
    const parsed = parseSearchCacheKey(new URL(request.url).searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.reason }, { status: 400 });
    }

    const { outcome, dbFailed } = await readThrough(
      SEARCH_CACHE,
      searchCacheRowKey(parsed.key),
      {
        allowFill: () =>
          checkRateLimit(
            `cache-fill-search:${getClientIp(request)}`,
            FILL_RATE_LIMIT,
            FILL_RATE_WINDOW
          ),
        fetchOwnCopy: () => fetchSearchPage(parsed.key),
      }
    );
    hit = outcome.kind === "hit";
    failed = dbFailed;
    return readThroughResponse(outcome, SEARCH_CACHE.ttlMs);
  } finally {
    logger.info(
      "Scryfall search cache lookup completed",
      "GET /api/cache/search",
      {
        hit,
        failed,
        durationMs: Math.round(performance.now() - startedAt),
      }
    );
  }
}
