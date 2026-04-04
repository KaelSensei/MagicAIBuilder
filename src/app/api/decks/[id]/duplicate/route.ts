import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/decks/[id]/duplicate — duplicate a deck with all its cards
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    const original = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const copy = await prisma.deck.create({
      data: {
        name: `${original.name} (Copy)`,
        format: original.format,
        targetBracket: original.targetBracket,
        manualBracket: original.manualBracket,
        budget: original.budget,
        commanderId: original.commanderId,
        partnerId: original.partnerId,
        companionId: original.companionId,
        pairingType: original.pairingType,
        userId: ownership.userId,
        // Don't copy share settings — new deck starts private
        cards: {
          create: original.cards.map((card) => ({
            scryfallId: card.scryfallId,
            name: card.name,
            manaCost: card.manaCost,
            cmc: card.cmc,
            typeLine: card.typeLine,
            oracleText: card.oracleText,
            power: card.power,
            toughness: card.toughness,
            colorIdentity: card.colorIdentity,
            isGameChanger: card.isGameChanger,
            isBanned: card.isBanned,
            price: card.price,
            imageUri: card.imageUri,
            artCropUri: card.artCropUri,
            category: card.category,
            quantity: card.quantity,
            isCommander: card.isCommander,
            isPartner: card.isPartner,
            zone: card.zone,
          })),
        },
      },
      include: { cards: true },
    });

    return NextResponse.json(copy, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks/:id/duplicate");
    return NextResponse.json({ error: "Failed to duplicate deck" }, { status: 500 });
  }
}
