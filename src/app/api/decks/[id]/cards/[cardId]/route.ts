import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { patchCardSchema } from "@/lib/validation/card";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";

type Params = { params: Promise<{ id: string; cardId: string }> };

// DELETE /api/decks/[id]/cards/[cardId] — remove a single card
export async function DELETE(_req: Request, { params }: Params) {
  const { id: deckId, cardId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

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
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/decks/:id/cards/:cardId", { deckId: String(deckId).slice(0, 50), cardId: String(cardId).slice(0, 50) });
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
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const card = await prisma.deckCard.findFirst({
      where: { id: cardId, deckId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const raw = jsonBody.value;
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
    logger.error(error instanceof Error ? error.message : "unknown", "PATCH /api/decks/:id/cards/:cardId", { deckId: String(deckId).slice(0, 50), cardId: String(cardId).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}
