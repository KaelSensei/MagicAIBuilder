/**
 * `GET /api/v1/decks` — the calling key's own decks.
 *
 * The first endpoint of the public REST API, and therefore where its
 * conventions are set: Bearer-key auth, a scope check, `{ data, pagination }`
 * on success and `{ error: { code, message } }` on failure. Later endpoints
 * follow this shape rather than inventing their own.
 *
 * Scoped to the key's owner and never to "all decks". A public API that
 * defaults to everything published is a scraping endpoint with a login on it;
 * community discovery is already served by its own routes, with its own rules
 * about what `isPublic` means.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { apiError, requireApiScope } from "@/lib/api/authenticate";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

const querySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export async function GET(request: Request) {
  const auth = await requireApiScope(request, "decks:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    // An out-of-range `limit` is rejected rather than clamped: silently serving
    // 100 to a client that asked for 500 makes it look like the page was the
    // last one, and it would stop paginating.
    return apiError("invalid_request", "page must be >= 0 and limit between 1 and 100");
  }

  const { page, limit } = parsed.data;

  try {
    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where: { userId: auth.caller.userId },
        orderBy: { updatedAt: "desc" },
        skip: page * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          format: true,
          commanderName: true,
          targetBracket: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { cards: true } },
        },
      }),
      prisma.deck.count({ where: { userId: auth.caller.userId } }),
    ]);

    return NextResponse.json({
      data: decks.map((deck) => ({
        id: deck.id,
        name: deck.name,
        format: deck.format,
        commanderName: deck.commanderName,
        targetBracket: deck.targetBracket,
        isPublic: deck.isPublic,
        cardCount: deck._count.cards,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deck listing failed";
    logger.error(message, "GET /api/v1/decks", { userId: auth.caller.userId });
    return apiError("server_error", "Could not list decks");
  }
}
