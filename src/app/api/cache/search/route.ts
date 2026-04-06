import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// GET /api/cache/search?key=<hash> — lookup cached search result
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.get("key");

  if (!cacheKey || cacheKey.length > 256) {
    return NextResponse.json({ hit: false });
  }

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
  try {
    const body = await request.json();
    const { cacheKey, data } = body;

    if (!cacheKey || !data) {
      return NextResponse.json(
        { error: "cacheKey and data are required" },
        { status: 400 }
      );
    }

    if (cacheKey.length > 256) {
      return NextResponse.json(
        { error: "Cache key too long" },
        { status: 400 }
      );
    }

    const MAX_CACHE_BYTES = 500 * 1024; // 500KB for search results (can be large)
    if (JSON.stringify(data).length > MAX_CACHE_BYTES) {
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
