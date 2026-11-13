/**
 * Community deck votes: `/api/community/decks/[id]/vote`.
 *
 * GET    — the tally for a deck the viewer may see (no session required)
 * POST   — cast or flip the caller's vote
 * DELETE — clear the caller's vote
 *
 * HTTP only: session, body parsing and the status for each outcome. The
 * rules live in the use cases of `@/lib/community/deck-vote-use-cases`.
 * Mounted under /api/community so the edge auth allowlist can expose GET
 * without opening the protected /api/decks tree, mirroring the ratings route.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import { voteUseCasePorts } from "@/lib/community/deck-interaction-server";
import {
  castVote,
  clearVote,
  readVoteTally,
  type CastVoteResult,
  type VoteTallyResult,
} from "@/lib/community/deck-vote-use-cases";
import { isValidVoteValue } from "@/lib/community/votes";

type Params = { params: Promise<{ id: string }> };

const VoteSchema = z.object({
  value: z.number().int().refine(isValidVoteValue, "Vote must be 1 or -1"),
});

const NOT_FOUND = { error: "Deck not found" };

/** The tally as the body, or the 404 a hidden or missing deck earns. */
function tallyResponse(result: VoteTallyResult, okStatus = 200) {
  switch (result.kind) {
    case "ok":
      return NextResponse.json(result.tally, { status: okStatus });
    case "not-found":
      return NextResponse.json(NOT_FOUND, { status: 404 });
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

function castVoteResponse(result: CastVoteResult) {
  if (result.kind === "own-deck") {
    return NextResponse.json(
      { error: "You cannot vote on your own deck" },
      { status: 403 }
    );
  }
  return tallyResponse(result, 201);
}

// GET /api/community/decks/[id]/vote
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    return tallyResponse(
      await readVoteTally({ deckId: id, viewerId }, voteUseCasePorts)
    );
  } catch (error) {
    logger.error(
      "Unexpected error",
      "GET /api/community/decks/:id/vote",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

// POST /api/community/decks/[id]/vote
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const voterId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = VoteSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }

    const command = { deckId: id, voterId, value: parsed.data.value };
    return castVoteResponse(await castVote(command, voteUseCasePorts));
  } catch (error) {
    logger.error(
      "Unexpected error",
      "POST /api/community/decks/:id/vote",
      error
    );
    return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
  }
}

// DELETE /api/community/decks/[id]/vote
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const voterId = authResult.session.user.id;

    return tallyResponse(
      await clearVote({ deckId: id, voterId }, voteUseCasePorts)
    );
  } catch (error) {
    logger.error(
      "Unexpected error",
      "DELETE /api/community/decks/:id/vote",
      error
    );
    return NextResponse.json(
      { error: "Failed to delete vote" },
      { status: 500 }
    );
  }
}
