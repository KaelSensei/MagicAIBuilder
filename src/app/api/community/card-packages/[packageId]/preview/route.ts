import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { previewCardPackage } from "@/lib/community/card-package-preview";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const PreviewRequestSchema = z.object({ deckId: z.string().min(1).max(50) });
const DeckFormatSchema = z.enum([
  "commander",
  "brawl",
  "oathbreaker",
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "pauper",
]);

interface RouteContext {
  readonly params: Promise<{ readonly packageId: string }>;
}

/** Preview package legality against an owned deck without mutating either resource. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = PreviewRequestSchema.safeParse(jsonBody.value);
    if (!body.success) {
      return NextResponse.json({ error: "Invalid preview request" }, { status: 400 });
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
        cards: {
          select: {
            name: true,
            quantity: true,
            isCommander: true,
            isPartner: true,
            typeLine: true,
            colorIdentity: true,
          },
        },
      },
    });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const format = DeckFormatSchema.safeParse(deck.format);
    if (!format.success) {
      return NextResponse.json({ error: "Unsupported deck format" }, { status: 422 });
    }

    const cardPackage = await prisma.cardPackage.findFirst({
      where: { id: packageId, OR: [{ isPublic: true }, { authorId: userId }] },
      select: {
        cards: {
          select: {
            scryfallId: true,
            name: true,
            quantity: true,
            colorIdentity: true,
            isBanned: true,
            isBasicLand: true,
          },
        },
      },
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

    return NextResponse.json(
      previewCardPackage(cardPackage.cards, {
        format: format.data,
        commanderColorIdentity: [...commanderColors],
        existingCards: deck.cards.map((card) => ({
          name: card.name,
          quantity: card.quantity,
          isBasicLand: card.typeLine.toLowerCase().includes("basic land"),
        })),
      })
    );
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/card-packages/:packageId/preview", error);
    return NextResponse.json({ error: "Failed to preview card package" }, { status: 500 });
  }
}
