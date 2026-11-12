// GET /api/collection/acquisition-plan: what the signed-in user still has to buy for their decks.
// The route reads and authorises; `@/lib/collection/acquisition-plan` decides what each deck needs.
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import {
  buildAcquisitionPlan,
  toAcquisitionPlanDeck,
} from "@/lib/collection/acquisition-plan";
import { logger } from "@/lib/logger";

/** Private, read-only purchase plan across the signed-in user's decks. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const userId = auth.session.user.id;
    const selectedId = new URL(request.url).searchParams.get("deckId");
    if (selectedId !== null && !z.string().min(1).max(100).safeParse(selectedId).success) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }
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

    const selectedDecks = selectedId === null
      ? decks
      : decks.filter((deck) => deck.id === selectedId);
    if (selectedId !== null && selectedDecks.length === 0) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json({
      deckCount: selectedDecks.length,
      decks: decks.map((deck) => ({ id: deck.id, name: deck.name })),
      items: buildAcquisitionPlan(
        selectedDecks.map(toAcquisitionPlanDeck),
        quantities
      ),
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/collection/acquisition-plan");
    return NextResponse.json({ error: "Failed to build acquisition plan" }, { status: 500 });
  }
}
