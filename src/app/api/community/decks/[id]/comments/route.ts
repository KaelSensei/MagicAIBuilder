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
 *
 * HTTP concerns only: the session, the JSON body and its schema, and the
 * mapping of each use-case outcome to a status code. The rules live in
 * `@/lib/community/comment-use-cases` (COM-13).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { deckComments } from "@/lib/community/comment-use-cases.server";
import type {
  ListCommentsResult,
  PostCommentResult,
} from "@/lib/community/comment-use-cases";
import { auth } from "@/lib/auth/config";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";

type Params = { params: Promise<{ id: string }> };

const CommentSchema = z.object({
  body: z.string(),
  parentId: z.string().optional(),
});

/** 404 for a missing deck and for a deck the caller may not see alike. */
const DECK_NOT_FOUND = { error: "Deck not found" };

function listResponse(result: ListCommentsResult): NextResponse {
  switch (result.status) {
    case "ok":
      return NextResponse.json({
        comments: result.comments,
        count: result.count,
      });
    case "deck-not-found":
      return NextResponse.json(DECK_NOT_FOUND, { status: 404 });
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

function postResponse(result: PostCommentResult): NextResponse {
  switch (result.status) {
    case "created":
      return NextResponse.json(result.comment, { status: 201 });
    case "deck-not-found":
      return NextResponse.json(DECK_NOT_FOUND, { status: 404 });
    case "invalid-body":
      return NextResponse.json({ error: result.errors }, { status: 400 });
    case "parent-not-found":
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 400 }
      );
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

// GET /api/community/decks/[id]/comments
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    const result = await deckComments.listComments({ deckId: id, viewerId });
    return listResponse(result);
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

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = CommentSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }

    const result = await deckComments.postComment({
      deckId: id,
      viewerId: userId,
      body: parsed.data.body,
      parentId: parsed.data.parentId,
    });
    return postResponse(result);
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
