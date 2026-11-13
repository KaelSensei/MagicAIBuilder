/**
 * `GET /api/meta/:commanderSlug?source=edhrec|tournament&refresh=true|false`:
 * what the wider meta plays for a commander, as `getCommanderMeta` answers it.
 *
 * The route holds HTTP concerns only: the per-client rate limit, the slug and
 * query validation, who may force a refresh, the `_meta` envelope of each
 * outcome and the status codes. The read-through itself (fresh cache, else
 * the provider, else the stale entry) is the meta insights use case (MI-04).
 *
 * @module app/api/meta/[commanderSlug]
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModerator } from "@/lib/auth/require-moderator";
import {
  getCommanderMeta,
  type CommanderMetaResult,
} from "@/modules/meta-insights/server";
import type { MetaSource } from "@/modules/meta-insights";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { rateLimitResponse, type RouteParams } from "@/lib/api/route-kit";

const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

const querySchema = z.object({
  source: z.enum(["edhrec", "tournament"]).default("edhrec"),
  // Exactly "true" or "false": `z.coerce.boolean()` read every non-empty
  // string as true, so `?refresh=false` forced a refresh.
  refresh: z
    .enum(["true", "false"])
    .default("false")
    .transform((flag) => flag === "true"),
});

function metaRateLimitResponse(request: Request): NextResponse | null {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`meta:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (rl.allowed) return null;
  return rateLimitResponse(
    rl,
    (seconds) => `Too many requests. Retry in ${seconds}s.`
  );
}

/**
 * Whether this request may skip a fresh cache and scrape EDHREC or MTGTop8
 * again. Only a moderator may: the route is public, and a refresh anyone could
 * force would let a loop over commander slugs keep the server scraping
 * upstream. Everyone else is served the cache, and still gets a live fetch
 * when no fresh cache row exists.
 *
 * @param requested - whether the query asked for a refresh
 * @returns true when the cache may be bypassed
 */
async function mayForceRefresh(requested: boolean): Promise<boolean> {
  if (!requested) return false;
  try {
    const moderator = await requireModerator();
    return moderator.error === undefined;
  } catch {
    // The moderator lookup failed: serve the cache rather than scrape (B2-12).
    return false;
  }
}

/**
 * The response of one outcome: the data at the top level and a `_meta`
 * envelope that says where it came from and when it was observed. A cached
 * answer reports its `cachedAt` as `observedAt`, since the cache stores what
 * the provider showed at that moment.
 */
function metaResponse(
  source: MetaSource,
  result: Exclude<CommanderMetaResult, { kind: "unavailable" }>
): NextResponse {
  switch (result.kind) {
    case "fresh-cache": {
      const cachedAt = result.cachedAt.toISOString();
      return NextResponse.json({
        ...result.data,
        _meta: { source, cached: true, cachedAt, observedAt: cachedAt },
      });
    }
    case "live":
      return NextResponse.json({
        ...result.data,
        _meta: {
          source,
          cached: false,
          observedAt: result.observedAt.toISOString(),
        },
      });
    case "stale-cache": {
      const cachedAt = result.cachedAt.toISOString();
      return NextResponse.json({
        ...result.data,
        _meta: {
          source,
          cached: true,
          stale: true,
          cachedAt,
          observedAt: cachedAt,
        },
      });
    }
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

export async function GET(
  request: Request,
  { params }: RouteParams<"commanderSlug">
) {
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
  const result = await getCommanderMeta({
    commanderSlug,
    source,
    forceRefresh: await mayForceRefresh(refresh),
  });

  if (result.kind === "stale-cache" || result.kind === "unavailable") {
    // Upstream detail (EDHREC / MTGTop8 hostnames, status lines) stays logged
    // and out of the response.
    logger.error(result.failure.message, "GET /api/meta/:slug", {
      commanderSlug,
      source,
    });
  }
  if (result.kind === "unavailable") {
    return NextResponse.json({ error: "Meta fetch failed" }, { status: 502 });
  }
  return metaResponse(source, result);
}
