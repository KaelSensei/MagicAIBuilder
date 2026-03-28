import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { fetchEdhrecData, fetchTournamentData } from "@/lib/meta/fetch";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { EdhrecData, TournamentData } from "@/lib/meta/fetch";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

const querySchema = z.object({
  source: z.enum(["edhrec", "tournament"]).default("edhrec"),
  refresh: z.coerce.boolean().default(false),
});

type Params = { params: Promise<{ commanderSlug: string }> };

export async function GET(request: Request, { params }: Params) {
  // Rate limit
  const ip = getClientIp(request);
  const rl = checkRateLimit(`meta:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { commanderSlug } = await params;

  // Validate slug: letters, numbers, hyphens only
  if (!commanderSlug || !/^[a-z0-9-]{1,100}$/.test(commanderSlug)) {
    return NextResponse.json({ error: "Invalid commander slug" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const { source, refresh } = parsed.data;

  // Check cache (unless refresh requested)
  if (!refresh) {
    try {
      const cached = await prisma.metaCache.findUnique({
        where: { commanderSlug_source: { commanderSlug, source } },
      });
      if (cached && cached.expiresAt > new Date()) {
        return NextResponse.json({
          ...(cached.data as object),
          _meta: { cached: true, cachedAt: cached.cachedAt.toISOString() },
        });
      }
    } catch {
      // DB error — fall through to live fetch
    }
  }

  // Live fetch
  try {
    let data: EdhrecData | TournamentData;

    if (source === "edhrec") {
      data = await fetchEdhrecData(commanderSlug);
    } else {
      // Convert slug back to approximate name for MTGTop8 search
      const commanderName = commanderSlug.replace(/-/g, " ");
      data = await fetchTournamentData(commanderName);
    }

    // Upsert cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    try {
      await prisma.metaCache.upsert({
        where: { commanderSlug_source: { commanderSlug, source } },
        create: { commanderSlug, source, data: data as object, expiresAt },
        update: { data: data as object, cachedAt: new Date(), expiresAt },
      });
    } catch {
      // Cache write failure is non-fatal
    }

    return NextResponse.json({ ...data, _meta: { cached: false } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta fetch failed";
    console.error("[GET /api/meta/:slug]", { commanderSlug, source }, message);

    // Serve stale cache on error
    try {
      const stale = await prisma.metaCache.findUnique({
        where: { commanderSlug_source: { commanderSlug, source } },
      });
      if (stale) {
        return NextResponse.json({
          ...(stale.data as object),
          _meta: { cached: true, stale: true, cachedAt: stale.cachedAt.toISOString() },
        });
      }
    } catch {
      // DB also failing
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
