import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { findDeckForViewer } from "@/lib/deck/deck-for-viewer";
import {
  PUBLIC_DECK_READ_WINDOW_MS,
  PUBLIC_DECK_READS_PER_CLIENT,
} from "@/lib/deck/public-read-policy";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { rateLimitResponse, type RouteParams } from "@/lib/api/route-kit";

/** A 429 once this client has spent its read budget, otherwise null. */
function readRateLimitResponse(request: Request): NextResponse | null {
  const limit = checkRateLimit(
    `deck-read:${getClientIp(request)}`,
    PUBLIC_DECK_READS_PER_CLIENT,
    PUBLIC_DECK_READ_WINDOW_MS
  );
  if (limit.allowed) return null;
  return rateLimitResponse(limit, "Too many deck requests");
}

/**
 * GET /api/deck/[id] — public deck view, no auth required for a public deck.
 *
 * The owner gets their whole deck, public or private. Anyone else gets a
 * public deck read through the public allowlist, and a private deck 404s.
 * See {@link findDeckForViewer}.
 *
 * Anyone may call it without a key, so each client address gets
 * {@link PUBLIC_DECK_READS_PER_CLIENT} reads per minute, counted before the id
 * is checked or the deck is read. The limiter is in-memory and per instance
 * (`src/lib/rate-limit.ts`).
 */
export async function GET(request: Request, { params }: RouteParams<"id">) {
  const rateLimited = readRateLimitResponse(request);
  if (rateLimited) return rateLimited;

  const { id } = await params;

  if (!id || id.length > 50) {
    return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
  }

  try {
    const session = await auth();
    const deck = await findDeckForViewer(id, session?.user?.id ?? null);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
    return NextResponse.json(deck);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/deck/:id",
      { id: String(id).slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 });
  }
}
