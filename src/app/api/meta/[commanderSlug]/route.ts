import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { fetchEdhrecData, fetchTournamentData } from "@/lib/meta/fetch";
import { recordEdhrecSnapshot } from "@/lib/meta/snapshots";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { EdhrecData, TournamentData } from "@/lib/meta/fetch";
import { logger } from "@/lib/logger";
import { toJsonPayload } from "@/lib/api/json-payload";

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

async function readFreshMetaCache(
  commanderSlug: string,
  source: MetaSource
): Promise<NextResponse | null> {
  try {
    const cached = await prisma.metaCache.findUnique({
      where: { commanderSlug_source: { commanderSlug, source } },
    });
    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({
        ...(cached.data as Record<string, unknown>),
        _meta: {
          cached: true,
          cachedAt: cached.cachedAt.toISOString(),
          observedAt: cached.cachedAt.toISOString(),
        },
      });
    }
  } catch {
    // DB error — fall through to live fetch
  }
  return null;
}

async function persistMetaCache(
  commanderSlug: string,
  source: MetaSource,
  data: EdhrecData | TournamentData,
  observedAt: Date
) {
  const expiresAt = new Date(observedAt.getTime() + CACHE_TTL_MS);
  const payload = toJsonPayload(data);
  try {
    await prisma.metaCache.upsert({
      where: { commanderSlug_source: { commanderSlug, source } },
      create: {
        commanderSlug,
        source,
        data: payload,
        cachedAt: observedAt,
        expiresAt,
      },
      update: { data: payload, cachedAt: observedAt, expiresAt },
    });
  } catch {
    // Cache write failure is non-fatal
  }
}

async function loadLiveMeta(
  commanderSlug: string,
  source: MetaSource
): Promise<EdhrecData | TournamentData> {
  if (source === "edhrec") {
    return fetchEdhrecData(commanderSlug);
  }
  const commanderName = commanderSlug.replaceAll("-", " ");
  return fetchTournamentData(commanderName);
}

/** `EdhrecData` is the branch carrying a distribution; the tournament feed is a list of events. */
function isEdhrecData(data: EdhrecData | TournamentData): data is EdhrecData {
  return "cards" in data;
}

async function tryStaleMetaResponse(
  commanderSlug: string,
  source: MetaSource
): Promise<NextResponse | null> {
  try {
    const stale = await prisma.metaCache.findUnique({
      where: { commanderSlug_source: { commanderSlug, source } },
    });
    if (stale) {
      return NextResponse.json({
        ...(stale.data as Record<string, unknown>),
        _meta: {
          cached: true,
          stale: true,
          cachedAt: stale.cachedAt.toISOString(),
          observedAt: stale.cachedAt.toISOString(),
        },
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
    return NextResponse.json(
      { error: "Invalid commander slug" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params" },
      { status: 400 }
    );
  }

  const { source, refresh } = parsed.data;

  if (!refresh) {
    const cachedResponse = await readFreshMetaCache(commanderSlug, source);
    if (cachedResponse) return cachedResponse;
  }

  try {
    const data = await loadLiveMeta(commanderSlug, source);
    const observedAt = new Date();
    await persistMetaCache(commanderSlug, source, data, observedAt);
    if (isEdhrecData(data)) {
      // Retain the distribution before the next refresh overwrites the cache.
      // Awaited rather than fired and forgotten: a serverless invocation can be
      // frozen the moment its response is returned, and a detached promise
      // would then be lost at random — the history would have holes nothing
      // could explain. `recordEdhrecSnapshot` never throws.
      await recordEdhrecSnapshot(commanderSlug, data);
    }
    return NextResponse.json({
      ...data,
      _meta: { cached: false, observedAt: observedAt.toISOString() },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meta fetch failed";
    logger.error(message, "GET /api/meta/:slug", { commanderSlug, source });
    const stale = await tryStaleMetaResponse(commanderSlug, source);
    if (stale) return stale;
    // Upstream detail (EDHRec / MTGTop8 hostnames, status lines) stays logged.
    return NextResponse.json({ error: "Meta fetch failed" }, { status: 502 });
  }
}
