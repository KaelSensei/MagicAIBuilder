/**
 * One deck comment.
 *
 * PATCH  — edit the caller's own comment body
 * DELETE — remove a comment; allowed for its author, and for the deck owner
 *          as the stream's minimal moderation surface. Replies cascade.
 *
 * HTTP concerns only: the session, the JSON body and its schema, and the
 * mapping of each use-case outcome to a status code. The rules live in
 * `@/lib/community/comment-use-cases` (COM-13).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { deckComments } from "@/lib/community/comment-use-cases.server";
import type {
  DeleteCommentResult,
  EditCommentResult,
} from "@/lib/community/comment-use-cases";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";

type Params = { params: Promise<{ id: string; commentId: string }> };

const EditSchema = z.object({ body: z.string() });

/** 404 for a missing deck and for a deck the caller may not see alike. */
const DECK_NOT_FOUND = { error: "Deck not found" };
/** 404 for a missing comment, one on another deck, or someone else's on edit. */
const COMMENT_NOT_FOUND = { error: "Comment not found" };

function editResponse(result: EditCommentResult): NextResponse {
  switch (result.status) {
    case "edited":
      return NextResponse.json(result.comment);
    case "deck-not-found":
      return NextResponse.json(DECK_NOT_FOUND, { status: 404 });
    case "invalid-body":
      return NextResponse.json({ error: result.errors }, { status: 400 });
    case "comment-not-found":
      return NextResponse.json(COMMENT_NOT_FOUND, { status: 404 });
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

function deleteResponse(result: DeleteCommentResult): NextResponse {
  switch (result.status) {
    case "deleted":
      return NextResponse.json({ deleted: true });
    case "deck-not-found":
      return NextResponse.json(DECK_NOT_FOUND, { status: 404 });
    case "comment-not-found":
      return NextResponse.json(COMMENT_NOT_FOUND, { status: 404 });
    case "forbidden":
      return NextResponse.json(
        { error: "You cannot delete this comment" },
        { status: 403 }
      );
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

// PATCH /api/community/decks/[id]/comments/[commentId]
export async function PATCH(request: Request, { params }: Params) {
  const { id, commentId } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = EditSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }

    const result = await deckComments.editComment({
      deckId: id,
      commentId,
      viewerId: userId,
      body: parsed.data.body,
    });
    return editResponse(result);
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

    const result = await deckComments.deleteComment({
      deckId: id,
      commentId,
      viewerId: userId,
    });
    return deleteResponse(result);
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
