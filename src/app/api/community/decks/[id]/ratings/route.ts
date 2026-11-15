/**
 * Community deck ratings & reviews: `/api/community/decks/[id]/ratings`.
 *
 * GET    — the aggregate and the written reviews of a deck the viewer may see
 *          (no session required)
 * POST   — rate or re-rate the deck, with an optional written review
 * DELETE — remove the caller's own rating
 *
 * HTTP only: session, body parsing and the status for each outcome. The
 * rules live in the use cases of `@/lib/community/deck-rating-use-cases`.
 * Mounted under /api/community so the edge auth allowlist can expose GET
 * without opening the protected /api/decks tree. POST and DELETE enforce
 * authentication here.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import { ratingUseCasePorts } from "@/lib/community/deck-interaction-server";
import {
  rateDeck,
  readDeckRatings,
  removeRating,
  type RateDeckResult,
} from "@/lib/community/deck-rating-use-cases";

type Params = { params: Promise<{ id: string }> };

const RatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
});

const NOT_FOUND = { error: "Deck not found" };

function rateDeckResponse(result: RateDeckResult) {
  switch (result.kind) {
    case "ok":
      return NextResponse.json(result.rating, { status: 201 });
    case "invalid":
      return NextResponse.json({ error: result.errors }, { status: 400 });
    case "not-found":
      return NextResponse.json(NOT_FOUND, { status: 404 });
    case "own-deck":
      return NextResponse.json(
        { error: "You cannot rate your own deck" },
        { status: 403 }
      );
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

function logFailure(route: string, error: unknown, id: string) {
  logger.error(error instanceof Error ? error.message : "unknown", route, {
    id: id.slice(0, 50),
  });
}

// GET /api/community/decks/[id]/ratings
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    const result = await readDeckRatings(
      { deckId: id, viewerId },
      ratingUseCasePorts
    );
    if (result.kind === "not-found") {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }
    return NextResponse.json(result.summary);
  } catch (error) {
    logFailure("GET /api/community/decks/:id/ratings", error, id);
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

// POST /api/community/decks/[id]/ratings
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const raterId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = RatingSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }

    const command = { deckId: id, raterId, ...parsed.data };
    return rateDeckResponse(await rateDeck(command, ratingUseCasePorts));
  } catch (error) {
    logFailure("POST /api/community/decks/:id/ratings", error, id);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}

// DELETE /api/community/decks/[id]/ratings
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const raterId = authResult.session.user.id;

    return NextResponse.json(
      await removeRating({ deckId: id, raterId }, ratingUseCasePorts)
    );
  } catch (error) {
    logFailure("DELETE /api/community/decks/:id/ratings", error, id);
    return NextResponse.json(
      { error: "Failed to delete rating" },
      { status: 500 }
    );
  }
}
