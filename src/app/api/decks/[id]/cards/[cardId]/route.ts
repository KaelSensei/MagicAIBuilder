import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string; cardId: string }> };

// DELETE /api/decks/[id]/cards/[cardId] — remove a single card
export async function DELETE(_req: Request, { params }: Params) {
  const { id: deckId, cardId } = await params;
  try {
    const card = await prisma.deckCard.findFirst({
      where: { id: cardId, deckId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.deckCard.delete({ where: { id: cardId } });
    await prisma.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/decks/${deckId}/cards/${cardId}]`, error);
    return NextResponse.json(
      { error: "Failed to remove card" },
      { status: 500 }
    );
  }
}

// PATCH /api/decks/[id]/cards/[cardId] — update card category (or other fields)
export async function PATCH(request: Request, { params }: Params) {
  const { id: deckId, cardId } = await params;
  try {
    const card = await prisma.deckCard.findFirst({
      where: { id: cardId, deckId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json();
    const { category, quantity, isGameChanger, isBanned, isCommander, isPartner } = body;

    if (
      category !== undefined &&
      typeof category !== "string"
    ) {
      return NextResponse.json(
        { error: "category must be a string" },
        { status: 400 }
      );
    }

    const updated = await prisma.deckCard.update({
      where: { id: cardId },
      data: {
        ...(category !== undefined && { category }),
        ...(quantity !== undefined && { quantity }),
        ...(isGameChanger !== undefined && { isGameChanger }),
        ...(isBanned !== undefined && { isBanned }),
        ...(isCommander !== undefined && { isCommander }),
        ...(isPartner !== undefined && { isPartner }),
      },
    });

    await prisma.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`[PATCH /api/decks/${deckId}/cards/${cardId}]`, error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}
