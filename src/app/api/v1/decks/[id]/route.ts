/**
 * `GET /api/v1/decks/:id` — one deck of the calling key's owner, with its cards.
 *
 * The listing endpoint deliberately omits cards; this is where they live. A
 * hundred rows per deck across a page of twenty-five would make the listing a
 * multi-megabyte response that most callers do not want.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { apiError, requireApiScope } from "@/lib/api/authenticate";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireApiScope(request, "decks:read");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Ownership is part of the WHERE, not a check after the read. Fetching
    // first and comparing afterwards means the row was already in memory, and
    // one early return away from being serialised to the wrong caller.
    const deck = await prisma.deck.findFirst({
      where: { id, userId: auth.caller.userId },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        format: true,
        commanderName: true,
        targetBracket: true,
        budget: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        cards: {
          select: {
            scryfallId: true,
            name: true,
            manaCost: true,
            cmc: true,
            typeLine: true,
            colorIdentity: true,
            category: true,
            quantity: true,
            isCommander: true,
            isPartner: true,
            zone: true,
            price: true,
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!deck) {
      // Someone else's deck and a deck that does not exist give the same
      // answer. Distinguishing them would let a caller enumerate which ids are
      // real, which is the whole of what an id leak is worth.
      return apiError("not_found", "Deck not found");
    }

    return NextResponse.json({
      data: {
        ...deck,
        budget: deck.budget,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deck read failed";
    logger.error(message, "GET /api/v1/decks/:id", { userId: auth.caller.userId });
    return apiError("server_error", "Could not read the deck");
  }
}
