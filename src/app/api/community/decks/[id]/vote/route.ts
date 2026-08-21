/**
 * Community deck votes.
 *
 * GET    — public tally for a deck (no session required)
 * POST   — cast or change the caller's vote
 * DELETE — clear the caller's vote
 *
 * Mounted under /api/community so the edge auth allowlist can expose GET
 * without opening the protected /api/decks tree, mirroring the ratings route.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { findVisibleDeck } from "@/lib/community/visible-deck";
import { auth } from "@/lib/auth/config";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { calculateVoteScore, isValidVoteValue, type DeckVote } from "@/lib/community/votes";
import { readJsonBody } from "@/lib/api/json-body";

type Params = { params: Promise<{ id: string }> };

const VoteSchema = z.object({
  value: z.number().int().refine(isValidVoteValue, "Vote must be 1 or -1"),
});

/**
 * Reads every vote on a deck and tallies it.
 *
 * @param deckId Deck identifier.
 * @param viewerId Signed-in user id, or null.
 * @returns The tally plus the viewer's own vote.
 */
async function loadTally(deckId: string, viewerId: string | null) {
  const rows = await prisma.deckVote.findMany({
    where: { deckId },
    select: { userId: true, deckId: true, value: true },
  });

  const votes = rows as readonly DeckVote[];

  return {
    ...calculateVoteScore(votes),
    viewerVote: votes.find((v) => v.userId === viewerId)?.value ?? null,
  };
}

// GET /api/community/decks/[id]/vote
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    const deck = await findVisibleDeck(id, viewerId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json(await loadTally(id, viewerId));
  } catch (error) {
    logger.error("Unexpected error", "GET /api/community/decks/:id/vote", error);
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}

// POST /api/community/decks/[id]/vote
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = VoteSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }
    const { value } = parsed.data;

    const deck = await findVisibleDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
    if (deck.userId === userId) {
      return NextResponse.json(
        { error: "You cannot vote on your own deck" },
        { status: 403 }
      );
    }

    // Upsert so flipping a vote replaces it rather than stacking a second row.
    await prisma.deckVote.upsert({
      where: { userId_deckId: { userId, deckId: id } },
      update: { value },
      create: { value, userId, deckId: id },
    });

    return NextResponse.json(await loadTally(id, userId), { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/decks/:id/vote", error);
    return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
  }
}

// DELETE /api/community/decks/[id]/vote
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    // deleteMany keeps this idempotent when no vote exists.
    await prisma.deckVote.deleteMany({ where: { userId, deckId: id } });

    return NextResponse.json(await loadTally(id, userId));
  } catch (error) {
    logger.error("Unexpected error", "DELETE /api/community/decks/:id/vote", error);
    return NextResponse.json({ error: "Failed to delete vote" }, { status: 500 });
  }
}
