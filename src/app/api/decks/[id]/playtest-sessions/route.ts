/**
 * Recorded playtest sessions for a deck.
 *
 * GET  — the caller's own sessions plus the aggregate summary
 * POST — record one session
 *
 * Mounted under /api/decks rather than /api/community: a playtest record is
 * private practice data, not something other viewers of a public deck should
 * read. Both verbs therefore require a session and scope every query to the
 * caller, so two players practising the same public deck never see each other's
 * results.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import type { PlaytestSession } from "@/lib/playtest/analytics";
import { parseSessionInput, summarizeSessions } from "@/lib/playtest/session-input";

type Params = { params: Promise<{ id: string }> };

/** Rows are capped so one enthusiastic tester cannot make the panel unbounded. */
const MAX_SESSIONS = 500;

/**
 * Confirms the caller owns the deck.
 *
 * Ownership rather than visibility: you may read a public deck, but you may
 * only record playtests against your own.
 *
 * @param deckId Deck identifier from the route.
 * @param userId Signed-in user id.
 * @returns The deck when the caller owns it, otherwise null.
 */
async function findOwnedDeck(deckId: string, userId: string) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { id: true, userId: true },
  });

  if (!deck || deck.userId !== userId) return null;
  return deck;
}

/**
 * Loads the caller's sessions for a deck, newest first.
 *
 * @param deckId Deck identifier.
 * @param userId Signed-in user id.
 * @returns The sessions, capped at MAX_SESSIONS.
 */
async function loadSessions(deckId: string, userId: string): Promise<PlaytestSession[]> {
  const rows = await prisma.playtestSession.findMany({
    where: { deckId, userId },
    orderBy: { createdAt: "desc" },
    take: MAX_SESSIONS,
  });

  // The column is a plain string; analytics expects the narrowed union.
  return rows.map((row) => ({
    id: row.id,
    deckId: row.deckId,
    userId: row.userId,
    result: row.result as PlaytestSession["result"],
    turns: row.turns,
    mulliganCount: row.mulliganCount,
    difficulty: (row.difficulty ?? undefined) as PlaytestSession["difficulty"],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  }));
}

// GET /api/decks/[id]/playtest-sessions
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const deck = await findOwnedDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const sessions = await loadSessions(id, userId);
    return NextResponse.json({ sessions, summary: summarizeSessions(sessions) });
  } catch (error) {
    logger.error("Unexpected error", "GET /api/decks/:id/playtest-sessions", error);
    return NextResponse.json({ error: "Failed to fetch playtest sessions" }, { status: 500 });
  }
}

// POST /api/decks/[id]/playtest-sessions
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const parsed = parseSessionInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deck = await findOwnedDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // No upsert: every run is its own row, which is the whole point of a trend.
    await prisma.playtestSession.create({
      data: { ...parsed.value, deckId: id, userId },
    });

    const sessions = await loadSessions(id, userId);
    return NextResponse.json(
      { sessions, summary: summarizeSessions(sessions) },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Unexpected error", "POST /api/decks/:id/playtest-sessions", error);
    return NextResponse.json({ error: "Failed to record playtest session" }, { status: 500 });
  }
}
