/**
 * `GET /api/v1/collection` — the calling key's owner's physical card collection.
 *
 * The endpoint `collection:read` was named for. That scope shipped with the
 * first key and, until now, granted nothing: a permission a user could tick
 * that bought them no access. An advertised permission with no meaning is worse
 * than a missing one — it invites a caller to request the narrowest scope that
 * fits their need and then fail at runtime for reasons the docs deny.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { apiError, requireApiScope } from "@/lib/api/authenticate";

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

const querySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export async function GET(request: Request) {
  const auth = await requireApiScope(request, "collection:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return apiError("invalid_request", "page must be >= 0 and limit between 1 and 200");
  }

  const { page, limit } = parsed.data;

  try {
    const [cards, total] = await Promise.all([
      prisma.collectionCard.findMany({
        where: { userId: auth.caller.userId },
        // Name then foil: the same card in both finishes is two rows by the
        // model's own unique constraint, and an unstable tiebreak would let a
        // row appear on two pages or none as the cursor moved.
        orderBy: [{ name: "asc" }, { foil: "asc" }],
        skip: page * limit,
        take: limit,
        select: {
          scryfallId: true,
          name: true,
          quantity: true,
          foil: true,
          condition: true,
          acquiredAt: true,
          price: true,
        },
      }),
      prisma.collectionCard.count({ where: { userId: auth.caller.userId } }),
    ]);

    return NextResponse.json({
      data: cards.map((card) => ({
        scryfallId: card.scryfallId,
        name: card.name,
        quantity: card.quantity,
        foil: card.foil,
        condition: card.condition,
        acquiredAt: card.acquiredAt?.toISOString() ?? null,
        price: card.price,
      })),
      pagination: { page, limit, total },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection listing failed";
    logger.error(message, "GET /api/v1/collection", { userId: auth.caller.userId });
    return apiError("server_error", "Could not list the collection");
  }
}
