import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { addCardSchema } from "@/lib/validation/card";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import { duplicatesOtherCommandSlot } from "@/lib/deck/commander-pairing";

type Params = { params: Promise<{ id: string }> };

/**
 * A command-zone card must not repeat the Oracle card held by the opposite
 * slot: the partner is compared with the commander, the commander with the partner.
 */
async function duplicatesCommandPairing(
  deckId: string,
  card: { readonly scryfallId: string; readonly isCommander: boolean; readonly isPartner: boolean }
): Promise<boolean> {
  if (!card.isCommander) return false;
  const slots = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { commanderId: true, partnerId: true },
  });
  const otherSlotId = card.isPartner ? slots?.commanderId : slots?.partnerId;
  return duplicatesOtherCommandSlot(card.scryfallId, otherSlotId ?? null);
}

// POST /api/decks/[id]/cards — add a card to a deck
export async function POST(request: Request, { params }: Params) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const raw = jsonBody.value;
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
      power,
      toughness,
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

    if (await duplicatesCommandPairing(deckId, { scryfallId, isCommander, isPartner })) {
      return NextResponse.json(
        { error: "Commander and partner must be different cards" },
        { status: 400 }
      );
    }

    const card = await prisma.deckCard.create({
      data: {
        deckId,
        scryfallId,
        name,
        manaCost,
        cmc,
        typeLine,
        oracleText,
        power,
        toughness,
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
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks/:id/cards", { deckId: String(deckId).slice(0, 50) });
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
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/decks/:id/cards", { deckId: String(deckId).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to remove cards" },
      { status: 500 }
    );
  }
}
