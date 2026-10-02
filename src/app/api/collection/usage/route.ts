import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const querySchema = z.string().min(1).max(100);

/** Return only this player's deck rows using the requested printing. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const scryfallId = querySchema.safeParse(new URL(request.url).searchParams.get("scryfallId"));
    if (!scryfallId.success) {
      return NextResponse.json({ error: "Invalid printing ID" }, { status: 400 });
    }

    const cards = await prisma.deckCard.findMany({
      where: { scryfallId: scryfallId.data, deck: { userId: auth.session.user.id } },
      select: {
        deckId: true,
        quantity: true,
        zone: true,
        deck: { select: { name: true } },
      },
    });

    return NextResponse.json({
      usages: cards.map((card) => ({
        deckId: card.deckId,
        deckName: card.deck.name,
        quantity: card.quantity,
        zone: card.zone,
      })),
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/collection/usage");
    return NextResponse.json({ error: "Failed to fetch printing usage" }, { status: 500 });
  }
}
