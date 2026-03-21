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
    console.error("[DELETE /api/decks/:id/cards/:cardId]", { deckId: String(deckId).slice(0, 50), cardId: String(cardId).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to remove card" },
      { status: 500 }
    );
  }
}

type CardPatchFields = {
  category?: string; quantity?: number; isGameChanger?: boolean; isBanned?: boolean;
  isCommander?: boolean; isPartner?: boolean; notes?: string | null;
  scryfallId?: string; imageUri?: string; artCropUri?: string;
  zone?: string;
};

function buildCardPatchData(fields: CardPatchFields) {
  const data: Record<string, unknown> = {};
  const simple = ["category", "quantity", "isGameChanger", "isBanned", "isCommander", "isPartner", "scryfallId", "imageUri", "artCropUri", "zone"] as const;
  for (const key of simple) {
    if (fields[key] !== undefined) data[key] = fields[key];
  }
  if (fields.notes !== undefined) data.notes = fields.notes ?? null;
  return data;
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

    const body = await request.json() as CardPatchFields;
    const { category } = body;

    if (category !== undefined && typeof category !== "string") {
      return NextResponse.json(
        { error: "category must be a string" },
        { status: 400 }
      );
    }

    const updated = await prisma.deckCard.update({
      where: { id: cardId },
      data: buildCardPatchData(body),
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
