/**
 * Community deck ratings & reviews.
 *
 * GET    — public aggregate for a deck (no session required)
 * POST   — upsert the caller's own rating / review
 * DELETE — remove the caller's own rating
 *
 * Mounted under /api/community so the edge auth allowlist can expose GET
 * without opening the protected /api/decks tree. POST and DELETE enforce
 * authentication here.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import {
  buildRatingHistogram,
  calculateAverageRating,
  getDeckQualityBadge,
  validateReview,
} from "@/lib/ratings/ratings";
import { toDeckRating, toDeckReview, type DeckRatingRow } from "@/lib/ratings/mappers";
import { readJsonBody } from "@/lib/api/json-body";

type Params = { params: Promise<{ id: string }> };

const RatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
});

/** Author fields joined onto each review for display. */
interface RatingAuthor {
  readonly name: string | null;
  readonly username: string | null;
  readonly image: string | null;
}

type RatingRowWithAuthor = DeckRatingRow & { readonly user: RatingAuthor };

const RATING_SELECT = {
  id: true,
  userId: true,
  deckId: true,
  rating: true,
  title: true,
  body: true,
  helpfulCount: true,
  createdAt: true,
  user: { select: { name: true, username: true, image: true } },
} as const;

/**
 * Loads a deck and confirms the viewer may see it.
 *
 * @param deckId Deck identifier from the route.
 * @param viewerId Signed-in user id, or null for anonymous viewers.
 * @returns The deck when visible, otherwise null.
 */
async function findVisibleDeck(deckId: string, viewerId: string | null) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { id: true, userId: true, isPublic: true },
  });

  if (!deck) return null;
  if (!deck.isPublic && deck.userId !== viewerId) return null;

  return deck;
}

// GET /api/community/decks/[id]/ratings
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    const deck = await findVisibleDeck(id, viewerId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const rows = (await prisma.deckRating.findMany({
      where: { deckId: id },
      orderBy: { createdAt: "desc" },
      select: RATING_SELECT,
    })) as RatingRowWithAuthor[];

    const ratings = rows.map(toDeckRating);
    const reviews = rows.flatMap((row) => {
      const review = toDeckReview(row);
      return review ? [{ ...review, author: row.user }] : [];
    });

    return NextResponse.json({
      average: calculateAverageRating(ratings),
      count: ratings.length,
      histogram: buildRatingHistogram(ratings),
      badge: getDeckQualityBadge(ratings),
      reviews,
      viewerRating: ratings.find((r) => r.userId === viewerId)?.rating ?? null,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/community/decks/:id/ratings",
      { id: id.slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}

// POST /api/community/decks/[id]/ratings
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = RatingSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }
    const { rating, title, body } = parsed.data;

    // A written review must satisfy the shared domain rules; a bare star need not.
    const isReview = title !== undefined || body !== undefined;
    if (isReview) {
      const validation = validateReview({ title: title ?? "", body: body ?? "", rating });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors }, { status: 400 });
      }
    }

    const deck = await findVisibleDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
    if (deck.userId === userId) {
      return NextResponse.json({ error: "You cannot rate your own deck" }, { status: 403 });
    }

    const values = { rating, title: title ?? null, body: body ?? null };

    const saved = await prisma.deckRating.upsert({
      where: { userId_deckId: { userId, deckId: id } },
      update: values,
      create: { ...values, userId, deckId: id },
      select: RATING_SELECT,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/community/decks/:id/ratings",
      { id: id.slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  }
}

// DELETE /api/community/decks/[id]/ratings
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    // deleteMany keeps this idempotent when no rating exists.
    const { count } = await prisma.deckRating.deleteMany({
      where: { userId: authResult.session.user.id, deckId: id },
    });

    return NextResponse.json({ deleted: count });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "DELETE /api/community/decks/:id/ratings",
      { id: id.slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
  }
}
