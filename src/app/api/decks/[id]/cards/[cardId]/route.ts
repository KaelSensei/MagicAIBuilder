import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { patchCardSchema } from "@/lib/validation/card";

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
    console.error("[DELETE /api/decks/:id/cards/:cardId]", { deckId: String(deckId).slice(0, 50), cardId: String(cardId).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to remove card" },
      { status: 500 }
    );
  }
}

// PATCH /api/decks/[id]/cards/[cardId] — update card category or zone
export async function PATCH(request: Request, { params }: Params) {
  const { id: deckId, cardId } = await params;
  try {
    const card = await prisma.deckCard.findFirst({
      where: { id: cardId, deckId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const raw = await request.json();
    const parsed = patchCardSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.category !== undefined) data.category = parsed.data.category;
    if (parsed.data.zone !== undefined) data.zone = parsed.data.zone;

    const updated = await prisma.deckCard.update({
      where: { id: cardId },
      data,
    });

    await prisma.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/decks/:id/cards/:cardId]", { deckId: String(deckId).slice(0, 50), cardId: String(cardId).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}
