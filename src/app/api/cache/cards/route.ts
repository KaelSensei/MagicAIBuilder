import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  cardCacheRowKey,
  parseCardCacheId,
} from "@/lib/scryfall/shared-cache-keys";
import { fetchCard } from "@/lib/scryfall/server-fetch";
import { CARD_CACHE, readThrough } from "@/lib/scryfall/shared-cache";
import { readThroughResponse } from "../read-through-response";

const FILL_RATE_LIMIT = 120; // max Scryfall fills
const FILL_RATE_WINDOW = 60_000; // per 60 seconds per client IP

/**
 * GET /api/cache/cards?id=<scryfallId>
 *
 * Read-through: serves the stored card, or fetches it from Scryfall, stores the
 * server's own copy and serves that. The route has no write handler, so
 * Next.js answers 405 to a POST: no client body can become a shared entry.
 */
export async function GET(request: Request): Promise<Response> {
  const startedAt = performance.now();
  let hit = false;
  let failed = false;
  try {
    const parsed = parseCardCacheId(new URL(request.url).searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.reason }, { status: 400 });
    }

    const { outcome, dbFailed } = await readThrough(
      CARD_CACHE,
      cardCacheRowKey(parsed.key),
      {
        allowFill: () =>
          checkRateLimit(
            `cache-fill-cards:${getClientIp(request)}`,
            FILL_RATE_LIMIT,
            FILL_RATE_WINDOW
          ),
        fetchOwnCopy: () => fetchCard(parsed.key),
      }
    );
    hit = outcome.kind === "hit";
    failed = dbFailed;
    return readThroughResponse(outcome, CARD_CACHE.ttlMs);
  } finally {
    logger.info("Card cache lookup completed", "GET /api/cache/cards", {
      hit,
      failed,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}
