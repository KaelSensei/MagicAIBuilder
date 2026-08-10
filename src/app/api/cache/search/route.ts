import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_SEARCH_CACHE_BYTES } from "@/lib/cache-limits";

const WRITE_RATE_LIMIT = 60; // max cache writes
const WRITE_RATE_WINDOW = 60_000; // per 60 seconds per user

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Generate cache key from query and page */
function generateCacheKey(query: string, page: number): string {
  return createHash("sha256").update(`${query}|${page}`).digest("hex");
}

// GET /api/cache/search?query=<string>&page=<number> — lookup cached search result
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const pageStr = searchParams.get("page");
  const page = pageStr ? Number.parseInt(pageStr, 10) : 1;

  if (!query || query.length === 0 || Number.isNaN(page)) {
    return NextResponse.json({ hit: false });
  }

  const cacheKey = generateCacheKey(query, page);

  try {
    const cached = await prisma.scryfallSearchCache.findUnique({
      where: { cacheKey },
    });

    if (!cached) {
      return NextResponse.json({ hit: false });
    }

    const age = Date.now() - new Date(cached.cachedAt).getTime();
    if (age > CACHE_TTL_MS) {
      // Stale — delete and report miss
      await prisma.scryfallSearchCache.delete({ where: { cacheKey } });
      return NextResponse.json({ hit: false });
    }

    return NextResponse.json({ hit: true, data: cached.data });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/cache/search",
      { key: String(cacheKey).slice(0, 50) }
    );
    return NextResponse.json({ hit: false });
  }
}

// POST /api/cache/search — store a search result in the cache
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const rl = checkRateLimit(`cache-search:${auth.session.user.id}`, WRITE_RATE_LIMIT, WRITE_RATE_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { query, page, data } = body;

    if (!query || !data || typeof page !== "number") {
      return NextResponse.json(
        { error: "query, page (number), and data are required" },
        { status: 400 }
      );
    }

    if (query.length === 0 || query.length > 1000) {
      return NextResponse.json(
        { error: "Query must be 1-1000 characters" },
        { status: 400 }
      );
    }

    const cacheKey = generateCacheKey(query, page);

    if (JSON.stringify(data).length > MAX_SEARCH_CACHE_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const entry = await prisma.scryfallSearchCache.upsert({
      where: { cacheKey },
      update: { data, cachedAt: new Date() },
      create: { cacheKey, data },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/cache/search"
    );
    return NextResponse.json(
      { error: "Failed to cache search result" },
      { status: 500 }
    );
  }
}
