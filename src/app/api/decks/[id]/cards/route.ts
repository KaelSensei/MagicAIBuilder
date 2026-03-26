import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { addCardSchema } from "@/lib/validation/card";
import { requireDeckOwner } from "@/lib/auth/helpers";

type Params = { params: Promise<{ id: string }> };

// POST /api/decks/[id]/cards — add a card to a deck
export async function POST(request: Request, { params }: Params) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const raw = await request.json();
    const parsed = addCardSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }

    const {
      scryfallId,
      name,
      manaCost,
      cmc,
      typeLine,
      oracleText,
      colorIdentity,
      isGameChanger,
      isBanned,
      price,
      imageUri,
      artCropUri,
      category,
      quantity,
      isCommander,
      isPartner,
      zone,
    } = parsed.data;

    const card = await prisma.deckCard.create({
      data: {
        deckId,
        scryfallId,
        name,
        manaCost,
        cmc,
        typeLine,
        oracleText,
        colorIdentity,
        isGameChanger,
        isBanned,
        price,
        imageUri,
        artCropUri,
        category,
        quantity,
        isCommander,
        isPartner,
        zone,
      },
    });

    // Update deck updatedAt
    await prisma.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("[POST /api/decks/:id/cards]", { deckId: String(deckId).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to add card" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id]/cards — remove all cards from a deck
export async function DELETE(_req: Request, { params }: Params) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    await prisma.deckCard.deleteMany({ where: { deckId } });
    await prisma.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/decks/:id/cards]", { deckId: String(deckId).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to remove cards" },
      { status: 500 }
    );
  }
}
