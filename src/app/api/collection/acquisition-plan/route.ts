import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { buildAcquisitionPlan } from "@/lib/collection/shopping-list";
import { logger } from "@/lib/logger";
import type { AcquisitionPlanCard } from "@/lib/collection/shopping-list";

/** Private, read-only purchase plan across the signed-in user's decks. */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const userId = auth.session.user.id;
    const [decks, ownedCards] = await Promise.all([
      prisma.deck.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          cards: {
            select: {
              id: true,
              scryfallId: true,
              name: true,
              quantity: true,
              price: true,
              typeLine: true,
              zone: true,
              isCommander: true,
              isPartner: true,
            },
          },
        },
      }),
      prisma.collectionCard.findMany({
        where: { userId },
        select: { scryfallId: true, quantity: true },
      }),
    ]);

    const quantities: Record<string, number> = {};
    for (const card of ownedCards) {
      quantities[card.scryfallId] = (quantities[card.scryfallId] ?? 0) + card.quantity;
    }

    const planDecks = decks.map((deck) => {
      const cards: AcquisitionPlanCard[] = [];
      let commander: AcquisitionPlanCard | null = null;
      let partner: AcquisitionPlanCard | null = null;
      for (const card of deck.cards) {
        if (card.isCommander) commander = card;
        else if (card.isPartner) partner = card;
        else cards.push(card);
      }
      return { id: deck.id, name: deck.name, cards, commander, partner };
    });

    return NextResponse.json({
      deckCount: decks.length,
      items: buildAcquisitionPlan(planDecks, quantities),
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/collection/acquisition-plan");
    return NextResponse.json({ error: "Failed to build acquisition plan" }, { status: 500 });
  }
}
