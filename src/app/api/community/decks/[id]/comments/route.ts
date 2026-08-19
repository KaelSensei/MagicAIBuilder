/**
 * Deck comment stream.
 *
 * GET  — the deck's threaded comments (no session required)
 * POST — add a comment or a reply as the caller
 *
 * Mounted under /api/community so the edge auth allowlist can expose GET
 * without opening the protected /api/decks tree. Unlike ratings and votes,
 * the deck owner is allowed to post — a stream where the author cannot
 * answer questions would be half a conversation.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { buildCommentTree, validateCommentBody } from "@/lib/community/comments";
import {
  toDeckComment,
  type DeckCommentRow,
} from "@/lib/community/comment-mappers";

type Params = { params: Promise<{ id: string }> };

const CommentSchema = z.object({
  body: z.string(),
  parentId: z.string().optional(),
});

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

// GET /api/community/decks/[id]/comments
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    const deck = await findVisibleDeck(id, viewerId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const rows = (await prisma.deckComment.findMany({
      where: { deckId: id },
      orderBy: { createdAt: "asc" },
      select: COMMENT_SELECT,
    })) as DeckCommentRow[];

    const comments = rows.map((row) => toDeckComment(row, deck.userId, viewerId));

    return NextResponse.json({
      comments: buildCommentTree(comments),
      count: comments.length,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/community/decks/:id/comments",
      { id: id.slice(0, 50) }
    );
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/community/decks/[id]/comments
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const deck = await findVisibleDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const parsed = CommentSchema.safeParse(await request.json());
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

    // A reply must answer a comment on this same deck — a parentId pointing
    // anywhere else would thread two decks' streams together.
    if (parsed.data.parentId !== undefined) {
      const parent = await prisma.deckComment.findUnique({
        where: { id: parsed.data.parentId },
        select: { deckId: true },
      });
      if (!parent || parent.deckId !== id) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 400 }
        );
      }
    }

    const row = (await prisma.deckComment.create({
      data: {
        deckId: id,
        userId,
        parentId: parsed.data.parentId ?? null,
        body: parsed.data.body.trim(),
      },
      select: COMMENT_SELECT,
    })) as DeckCommentRow;

    return NextResponse.json(toDeckComment(row, deck.userId, userId), {
      status: 201,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/community/decks/:id/comments",
      { id: id.slice(0, 50) }
    );
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
