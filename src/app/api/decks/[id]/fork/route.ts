import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { buildForkData } from "@/lib/deck/fork";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

/** POST /api/decks/[id]/fork — create a private attributed copy of a public deck. */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!id || id.length > 50) {
    return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
  }

  const authentication = await requireAuth();
  if (authentication.error) return authentication.error;

  try {
    const source = await prisma.deck.findUnique({
      where: { id },
      include: {
        cards: true,
        user: { select: { name: true, username: true } },
      },
    });

    if (!source || !source.isPublic) {
      return NextResponse.json({ error: "Public deck not found" }, { status: 404 });
    }

    const forkData = buildForkData(
      {
        id: source.id,
        name: source.name,
        description: source.description,
        format: source.format,
        targetBracket: source.targetBracket,
        manualBracket: source.manualBracket,
        budget: source.budget,
        commanderId: source.commanderId,
        commanderName: source.commanderName,
        partnerId: source.partnerId,
        companionId: source.companionId,
        pairingType: source.pairingType,
        userId: source.userId,
        userName: source.user?.name ?? source.user?.username ?? null,
        cards: source.cards.map((card) => ({
          ...card,
          zone: card.zone === "sideboard" || card.zone === "maybeboard" ? card.zone : "main",
        })),
      },
      authentication.session.user.id
    );
    const { cards, ...deckData } = forkData;

    const fork = await prisma.deck.create({
      data: {
        ...deckData,
        cards: { create: cards.map((card) => ({ ...card })) },
      },
      include: { cards: true },
    });

    return NextResponse.json(fork, { status: 201 });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/decks/:id/fork",
      { id }
    );
    return NextResponse.json({ error: "Failed to fork deck" }, { status: 500 });
  }
}
