import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { readJsonBody, readRecord } from "@/lib/api/json-body";

/**
 * Round-trips a validated value into Prisma's JSON input type.
 *
 * Same idiom as `metaCachePayload` in the meta route: `JSON.parse` returns
 * `any`, which satisfies `InputJsonValue` without an assertion, and the
 * round-trip drops anything non-serialisable.
 */
function asJsonPayload(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}


const WRITE_RATE_LIMIT = 120; // max cache writes
const WRITE_RATE_WINDOW = 60_000; // per 60 seconds per user

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SCRYFALL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/cache/cards?id=<scryfallId> — lookup cached card
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scryfallId = searchParams.get("id");

  if (!scryfallId || !SCRYFALL_UUID_REGEX.test(scryfallId)) {
    return NextResponse.json({ hit: false });
  }

  try {
    const cached = await prisma.cardCache.findUnique({
      where: { scryfallId },
    });

    if (!cached) {
      return NextResponse.json({ hit: false });
    }

    const age = Date.now() - new Date(cached.cachedAt).getTime();
    if (age > CACHE_TTL_MS) {
      // Stale — delete and report miss
      await prisma.cardCache.delete({ where: { scryfallId } });
      return NextResponse.json({ hit: false });
    }

    return NextResponse.json({ hit: true, data: cached.data });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/cache/cards", { id: String(scryfallId).slice(0, 50) });
    return NextResponse.json({ hit: false });
  }
}

// POST /api/cache/cards — store a card in the cache
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const rl = checkRateLimit(`cache-cards:${auth.session.user.id}`, WRITE_RATE_LIMIT, WRITE_RATE_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = readRecord(jsonBody.value);
    const scryfallId = typeof body.scryfallId === "string" ? body.scryfallId : "";
    const { data } = body;

    if (!scryfallId || !data) {
      return NextResponse.json(
        { error: "scryfallId and data are required" },
        { status: 400 }
      );
    }

    const MAX_CACHE_BYTES = 50 * 1024; // 50KB
    if (JSON.stringify(data).length > MAX_CACHE_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    if (!SCRYFALL_UUID_REGEX.test(scryfallId)) {
      return NextResponse.json({ error: "Invalid scryfallId" }, { status: 400 });
    }

    const entry = await prisma.cardCache.upsert({
      where: { scryfallId },
      update: { data: asJsonPayload(data), cachedAt: new Date() },
      create: { scryfallId, data: asJsonPayload(data) },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/cache/cards");
    return NextResponse.json(
      { error: "Failed to cache card" },
      { status: 500 }
    );
  }
}
