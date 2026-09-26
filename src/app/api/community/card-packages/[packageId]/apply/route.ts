import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { previewCardPackage } from "@/lib/community/card-package-preview";
import { verifyPackageCards } from "@/lib/community/verified-package-cards";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const ApplyRequestSchema = z.object({
  deckId: z.string().min(1).max(50),
  acceptedScryfallIds: z.array(z.string().min(1).max(100)).min(1).max(100),
});
const DeckFormatSchema = z.enum([
  "commander", "brawl", "oathbreaker", "standard", "pioneer",
  "modern", "legacy", "vintage", "pauper",
]);

interface RouteContext {
  readonly params: Promise<{ readonly packageId: string }>;
}

/** Add only reviewed, still-legal package cards to an owned deck. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = ApplyRequestSchema.safeParse(jsonBody.value);
    if (!body.success) {
      return NextResponse.json({ error: "Invalid apply request" }, { status: 400 });
    }

    const { packageId } = await context.params;
    if (!packageId || packageId.length > 50) {
      return NextResponse.json({ error: "Invalid package id" }, { status: 400 });
    }

    const userId = authentication.session.user.id;
    const deck = await prisma.deck.findFirst({
      where: { id: body.data.deckId, userId },
      select: {
        format: true,
        cards: { select: {
          name: true, quantity: true, isCommander: true, isPartner: true,
          typeLine: true, colorIdentity: true,
        } },
      },
    });
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    const format = DeckFormatSchema.safeParse(deck.format);
    if (!format.success) {
      return NextResponse.json({ error: "Unsupported deck format" }, { status: 422 });
    }

    const cardPackage = await prisma.cardPackage.findFirst({
      where: { id: packageId, OR: [{ isPublic: true }, { authorId: userId }] },
      select: { cards: { select: {
        scryfallId: true, name: true, quantity: true, colorIdentity: true,
        isBanned: true, isBasicLand: true, imageUri: true,
      } } },
    });
    if (!cardPackage) {
      return NextResponse.json({ error: "Card package not found" }, { status: 404 });
    }

    const commanderColors = new Set<string>();
    for (const card of deck.cards) {
      if (card.isCommander || card.isPartner) {
        for (const color of card.colorIdentity) commanderColors.add(color);
      }
    }
    const acceptedIds = new Set(body.data.acceptedScryfallIds);
    const acceptedCards = await verifyPackageCards(
      cardPackage.cards.filter((card) => acceptedIds.has(card.scryfallId)),
      format.data
    );
    const preview = previewCardPackage(acceptedCards, {
      format: format.data,
      commanderColorIdentity: [...commanderColors],
      existingCards: deck.cards.map((card) => ({
        name: card.name,
        quantity: card.quantity,
        isBasicLand: card.typeLine.toLowerCase().includes("basic land"),
      })),
    });
    const readyIds = new Set(
      preview.cards.filter((card) => card.status === "ready").map((card) => card.scryfallId)
    );
    const readyCards = acceptedCards.filter((card) => readyIds.has(card.scryfallId));
    if (readyCards.length === 0) {
      return NextResponse.json({ addedCount: 0, blockedCount: preview.blockedCount });
    }

    const [createResult] = await prisma.$transaction([
      prisma.deckCard.createMany({
        data: readyCards.map((card) => ({
          deckId: body.data.deckId,
          scryfallId: card.scryfallId,
          name: card.name,
          quantity: card.quantity,
          colorIdentity: [...card.colorIdentity],
          isBanned: card.isBanned,
          imageUri: card.imageUri,
          typeLine: card.isBasicLand ? "Basic Land" : "",
          category: card.isBasicLand ? "land" : "other",
          zone: "main",
        })),
      }),
      prisma.deck.update({
        where: { id: body.data.deckId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return NextResponse.json({ addedCount: createResult.count, blockedCount: preview.blockedCount });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/card-packages/:packageId/apply", error);
    return NextResponse.json({ error: "Failed to apply card package" }, { status: 500 });
  }
}
