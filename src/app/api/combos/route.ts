import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/json-body";
import { rateLimitResponse, retryAfterHeaders } from "@/lib/api/route-kit";
import {
  COMBO_LOOKUPS_PER_CLIENT,
  COMBO_LOOKUP_WINDOW_MS,
  MAX_QUERY_BODY_BYTES,
  SPELLBOOK_CALLS_PER_WINDOW,
  deckComboQuerySchema,
  normalizeDeckComboQuery,
} from "@/modules/combos";
import type { SpellbookVariant } from "@/modules/combos/client";
import {
  readCachedCombos,
  requestDeckCombos,
  storeCachedCombos,
  type DeckCombosResult,
} from "@/modules/combos/server";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const UNAVAILABLE = { error: "Combo lookup unavailable" };

function clientRateLimitResponse(request: Request): NextResponse | null {
  const ip = getClientIp(request);
  const limit = checkRateLimit(
    `combos:${ip}`,
    COMBO_LOOKUPS_PER_CLIENT,
    COMBO_LOOKUP_WINDOW_MS
  );
  if (limit.allowed) return null;
  return rateLimitResponse(limit, "Too many combo lookups");
}

function declaresOversizeBody(request: Request): boolean {
  return (
    Number(request.headers.get("content-length") ?? "0") > MAX_QUERY_BODY_BYTES
  );
}

function combosResponse(combos: readonly SpellbookVariant[]): NextResponse {
  return NextResponse.json({ combos });
}

function upstreamFailureResponse(
  result: Exclude<DeckCombosResult, { kind: "found" }>
): NextResponse {
  switch (result.kind) {
    case "timeout":
      logger.warn("Commander Spellbook timed out", "POST /api/combos");
      return NextResponse.json(UNAVAILABLE, { status: 504 });
    case "unexpected-body":
      logger.warn(
        "Commander Spellbook sent an unexpected response",
        "POST /api/combos"
      );
      return NextResponse.json(UNAVAILABLE, { status: 502 });
    case "failed":
      logger.warn("Commander Spellbook lookup failed", "POST /api/combos", {
        status: result.status,
      });
      return NextResponse.json(UNAVAILABLE, { status: 502 });
    default: {
      const unhandled: never = result;
      return unhandled;
    }
  }
}

/**
 * POST /api/combos — the combos one deck can assemble, from Commander Spellbook.
 *
 * Body: `{ commanders: string[], main: string[] }`, at most 2 commanders and
 * 250 main-deck names of 200 characters. The list is put in canonical form and
 * answered from a 6-hour server cache when possible; otherwise Spellbook's
 * deck-level `find-my-combos` endpoint is called once. Limits: 30 lookups per
 * minute per client address, and 60 Spellbook calls per minute per server.
 *
 * Answers `{ combos }`, or `{ error }` with 400 or 413 for a bad list, 429 when
 * the client is over its limit, 503 when the Spellbook budget is spent, and 502
 * or 504 when Spellbook fails or times out.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rateLimited = clientRateLimitResponse(request);
  if (rateLimited) return rateLimited;

  if (declaresOversizeBody(request)) {
    return NextResponse.json({ error: "Card list too large" }, { status: 413 });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = deckComboQuerySchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid card list",
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 }
    );
  }

  const query = normalizeDeckComboQuery(parsed.data);
  if (query.commanders.length + query.main.length === 0) {
    return combosResponse([]);
  }

  const cached = readCachedCombos(query);
  if (cached) return combosResponse(cached);

  // Not under "combos:", so no client address can share this bucket.
  const budget = checkRateLimit(
    "spellbook-upstream",
    SPELLBOOK_CALLS_PER_WINDOW,
    COMBO_LOOKUP_WINDOW_MS
  );
  if (!budget.allowed) {
    return NextResponse.json(UNAVAILABLE, {
      status: 503,
      headers: retryAfterHeaders(budget),
    });
  }

  const result = await requestDeckCombos(query);
  if (result.kind !== "found") return upstreamFailureResponse(result);
  storeCachedCombos(query, result.combos);
  return combosResponse(result.combos);
}
