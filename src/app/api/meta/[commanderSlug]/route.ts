import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { fetchEdhrecData, fetchTournamentData } from "@/lib/meta/fetch";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { EdhrecData, TournamentData } from "@/lib/meta/fetch";
import { logger } from "@/lib/logger";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

const querySchema = z.object({
  source: z.enum(["edhrec", "tournament"]).default("edhrec"),
  refresh: z.coerce.boolean().default(false),
});

type Params = { params: Promise<{ commanderSlug: string }> };

type MetaSource = z.infer<typeof querySchema>["source"];

function metaRateLimitResponse(request: Request): NextResponse | null {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`meta:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (rl.allowed) return null;
  const retrySec = Math.ceil(rl.retryAfterMs / 1000);
  return NextResponse.json(
    { error: `Too many requests. Retry in ${retrySec}s.` },
    { status: 429, headers: { "Retry-After": String(retrySec) } }
  );
}

async function readFreshMetaCache(commanderSlug: string, source: MetaSource): Promise<NextResponse | null> {
  try {
    const cached = await prisma.metaCache.findUnique({
      where: { commanderSlug_source: { commanderSlug, source } },
    });
    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({
        ...(cached.data as Record<string, unknown>),
        _meta: { cached: true, cachedAt: cached.cachedAt.toISOString() },
      });
    }
  } catch {
    // DB error — fall through to live fetch
  }
  return null;
}

function metaCachePayload(data: EdhrecData | TournamentData): Prisma.InputJsonValue {
  const encoded = JSON.stringify(data);
  return JSON.parse(encoded);
}

async function persistMetaCache(commanderSlug: string, source: MetaSource, data: EdhrecData | TournamentData) {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
  const payload = metaCachePayload(data);
  try {
    await prisma.metaCache.upsert({
      where: { commanderSlug_source: { commanderSlug, source } },
      create: { commanderSlug, source, data: payload, expiresAt },
      update: { data: payload, cachedAt: new Date(), expiresAt },
    });
  } catch {
    // Cache write failure is non-fatal
  }
}

async function loadLiveMeta(commanderSlug: string, source: MetaSource): Promise<EdhrecData | TournamentData> {
  if (source === "edhrec") {
    return fetchEdhrecData(commanderSlug);
  }
  const commanderName = commanderSlug.replaceAll("-", " ");
  return fetchTournamentData(commanderName);
}

async function tryStaleMetaResponse(commanderSlug: string, source: MetaSource): Promise<NextResponse | null> {
  try {
    const stale = await prisma.metaCache.findUnique({
      where: { commanderSlug_source: { commanderSlug, source } },
    });
    if (stale) {
      return NextResponse.json({
        ...(stale.data as Record<string, unknown>),
        _meta: { cached: true, stale: true, cachedAt: stale.cachedAt.toISOString() },
      });
    }
  } catch {
    // DB also failing
  }
  return null;
}

export async function GET(request: Request, { params }: Params) {
  const rateLimited = metaRateLimitResponse(request);
  if (rateLimited) return rateLimited;

  const { commanderSlug } = await params;
  if (!commanderSlug || !/^[a-z0-9-]{1,100}$/.test(commanderSlug)) {
    return NextResponse.json({ error: "Invalid commander slug" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const { source, refresh } = parsed.data;

  if (!refresh) {
    const cachedResponse = await readFreshMetaCache(commanderSlug, source);
    if (cachedResponse) return cachedResponse;
  }

  try {
    const data = await loadLiveMeta(commanderSlug, source);
    await persistMetaCache(commanderSlug, source, data);
    return NextResponse.json({ ...data, _meta: { cached: false } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta fetch failed";
    logger.error(message, "GET /api/meta/:slug", { commanderSlug, source });
    const stale = await tryStaleMetaResponse(commanderSlug, source);
    if (stale) return stale;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
