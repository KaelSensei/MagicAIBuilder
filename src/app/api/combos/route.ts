/**
 * `POST /api/combos`: the HTTP face of the combo lookup.
 *
 * The route parses and validates the body, enforces the per-client rate limit
 * and the body size, calls `lookupDeckCombos` from the combos context and maps
 * its result to a status code, a body and a log line. The lookup itself (the
 * canonical form, the cache, the Spellbook budget and the Spellbook call) lives
 * in `@/modules/combos/server`. Any visitor may call it; there is no session.
 *
 * @module app/api/combos/route
 */
import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/json-body";
import { rateLimitResponse, retryAfterHeaders } from "@/lib/api/route-kit";
import {
  COMBO_LOOKUPS_PER_CLIENT,
  COMBO_LOOKUP_WINDOW_MS,
  MAX_QUERY_BODY_BYTES,
  deckComboQuerySchema,
  type Combo,
} from "@/modules/combos";
import {
  lookupDeckCombos,
  type DeckCombosFailure,
  type LookupDeckCombosResult,
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

function combosResponse(combos: readonly Combo[]): NextResponse {
  return NextResponse.json({ combos });
}

function upstreamFailureResponse(failure: DeckCombosFailure): NextResponse {
  switch (failure.kind) {
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
        status: failure.status,
      });
      return NextResponse.json(UNAVAILABLE, { status: 502 });
    default: {
      const unhandled: never = failure;
      return unhandled;
    }
  }
}

function lookupResponse(result: LookupDeckCombosResult): NextResponse {
  switch (result.status) {
    case "ok":
      return combosResponse(result.combos);
    case "budget-exhausted":
      return NextResponse.json(UNAVAILABLE, {
        status: 503,
        headers: retryAfterHeaders(result),
      });
    case "upstream-failed":
      return upstreamFailureResponse(result.failure);
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

  return lookupResponse(await lookupDeckCombos(parsed.data));
}
