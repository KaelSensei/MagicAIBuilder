/**
 * `GET /api/user/stats?year=`: one year of the signed-in player's deck
 * statistics, computed on request (I-60 slice 2, requirement 2.1;
 * `docs/product/specs/i60-player-stats-and-year-in-review.md`).
 *
 * Deck analysis. Session only (`requireAuth`): the decks counted are the
 * caller's own. The `/stats` page renders the same report in-process; the
 * browser calls this route when the player picks another year. Rate limited
 * against abuse only: each call maps and estimates every deck the player has.
 *
 * @module api/user/stats
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { readPlayerStatsReport } from "@/lib/deck/player-stats-read";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  jsonError,
  logRouteFailure,
  rateLimitResponse,
  withRequestLog,
} from "@/lib/api/route-kit";

const CONTEXT = "GET /api/user/stats";

/** Reads per account per minute: far above a player switching years by hand. */
const READS_PER_WINDOW = 30;
const READ_WINDOW_MS = 60_000;

/** GET /api/user/stats — the caller's statistics for one year. */
export async function GET(request: NextRequest) {
  return withRequestLog(
    { message: "Player stats request completed", context: CONTEXT },
    () => answerStats(request)
  );
}

async function answerStats(request: NextRequest): Promise<NextResponse> {
  const result = await requireAuth();
  if (result.error) return result.error;
  const userId = result.session.user.id;

  const budget = checkRateLimit(
    `player-stats:${userId}`,
    READS_PER_WINDOW,
    READ_WINDOW_MS
  );
  if (!budget.allowed) {
    return rateLimitResponse(budget, "Too many requests. Try again later.");
  }

  try {
    const read = await readPlayerStatsReport({
      userId,
      year: request.nextUrl.searchParams.get("year"),
      now: new Date(),
    });
    switch (read.kind) {
      case "found":
        return NextResponse.json(read.report, {
          headers: { "Cache-Control": "private, no-store" },
        });
      case "invalid-year":
        return jsonError(400, "Invalid year");
      case "no-account":
        return jsonError(401, "Unauthorized");
      default: {
        const unreachable: never = read;
        return unreachable;
      }
    }
  } catch (error) {
    logRouteFailure(error, CONTEXT);
    return jsonError(500, "Failed to load statistics");
  }
}
