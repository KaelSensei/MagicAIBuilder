/**
 * One deck comment.
 *
 * PATCH  — edit the caller's own comment body
 * DELETE — remove a comment; allowed for its author, and for the deck owner
 *          as the stream's minimal moderation surface. Replies cascade.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { validateCommentBody } from "@/lib/community/comments";
import { readJsonBody } from "@/lib/api/json-body";
import {
  toDeckComment,
  type DeckCommentRow,
} from "@/lib/community/comment-mappers";

type Params = { params: Promise<{ id: string; commentId: string }> };

const EditSchema = z.object({ body: z.string() });

const COMMENT_SELECT = {
  id: true,
  deckId: true,
  userId: true,
  parentId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { name: true, username: true, image: true } },
} as const;

/**
 * Loads a deck and confirms the viewer may see it.
 *
 * @param deckId Deck identifier from the route.
 * @param viewerId Signed-in user id.
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

// PATCH /api/community/decks/[id]/comments/[commentId]
export async function PATCH(request: Request, { params }: Params) {
  const { id, commentId } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const deck = await findVisibleDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = EditSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }

    const validation = validateCommentBody(parsed.data.body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors }, { status: 400 });
    }

    // Scoped to the author: someone else's comment reads as not found, the
    // same non-leak the deck visibility check uses.
    const updated = await prisma.deckComment.updateMany({
      where: { id: commentId, deckId: id, userId },
      data: { body: parsed.data.body.trim() },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const row = (await prisma.deckComment.findUnique({
      where: { id: commentId },
      select: COMMENT_SELECT,
    })) as DeckCommentRow | null;
    if (!row) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json(toDeckComment(row, deck.userId, userId));
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "PATCH /api/community/decks/:id/comments/:commentId",
      { id: id.slice(0, 50) }
    );
    return NextResponse.json(
      { error: "Failed to edit comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/community/decks/[id]/comments/[commentId]
export async function DELETE(_req: Request, { params }: Params) {
  const { id, commentId } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const deck = await findVisibleDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const comment = await prisma.deckComment.findUnique({
      where: { id: commentId },
      select: { userId: true, deckId: true },
    });
    if (comment?.deckId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isAuthor = comment.userId === userId;
    const isDeckOwner = deck.userId === userId;
    if (!isAuthor && !isDeckOwner) {
      return NextResponse.json(
        { error: "You cannot delete this comment" },
        { status: 403 }
      );
    }

    // Replies cascade at the database level (self-relation ON DELETE CASCADE).
    await prisma.deckComment.delete({ where: { id: commentId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "DELETE /api/community/decks/:id/comments/:commentId",
      { id: id.slice(0, 50) }
    );
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
