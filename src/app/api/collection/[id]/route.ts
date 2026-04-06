import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

const patchSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  condition: z.enum(["NM", "LP", "MP", "HP", "DMG"]).nullable().optional(),
  foil: z.boolean().optional(),
  price: z.number().positive().nullable().optional(),
  acquiredAt: z.iso.datetime().nullable().optional(),
  scryfallId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  imageUri: z.string().optional(),
});

/** Build a Prisma update data object from validated patch fields */
function buildUpdateData(data: z.infer<typeof patchSchema>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (data.quantity !== undefined) update.quantity = data.quantity;
  if (data.condition !== undefined) update.condition = data.condition;
  if (data.foil !== undefined) update.foil = data.foil;
  if (data.price !== undefined) update.price = data.price;
  if (data.scryfallId !== undefined) update.scryfallId = data.scryfallId;
  if (data.name !== undefined) update.name = data.name;
  if (data.imageUri !== undefined) update.imageUri = data.imageUri;
  if (data.acquiredAt !== undefined) {
    update.acquiredAt = data.acquiredAt ? new Date(data.acquiredAt) : null;
  }
  return update;
}

/** Handle printing swap — may merge into an existing row */
async function handlePrintingSwap(
  id: string,
  card: { scryfallId: string; foil: boolean; quantity: number },
  data: z.infer<typeof patchSchema>,
  userId: string
): Promise<Response | null> {
  if (!data.scryfallId || data.scryfallId === card.scryfallId) return null;

  const existing = await prisma.collectionCard.findUnique({
    where: {
      scryfallId_foil_userId: {
        scryfallId: data.scryfallId,
        foil: data.foil ?? card.foil,
        userId,
      },
    },
  });

  if (!existing) return null;

  const merged = await prisma.collectionCard.update({
    where: { id: existing.id },
    data: {
      quantity: existing.quantity + (data.quantity ?? card.quantity),
      ...buildUpdateData({ ...data, quantity: undefined, scryfallId: undefined }),
    },
  });

  await prisma.collectionCard.delete({ where: { id } });
  return NextResponse.json({ merged: true, mergedFromId: id, card: merged });
}

// PATCH /api/collection/[id] — update quantity/condition/etc
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const { id } = await params;

    const card = await prisma.collectionCard.findUnique({ where: { id } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    if (card.userId && card.userId !== result.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.quantity === 0) {
      await prisma.collectionCard.delete({ where: { id } });
      return NextResponse.json({ deleted: true });
    }

    const mergeResult = await handlePrintingSwap(id, card, data, result.session.user.id);
    if (mergeResult) return mergeResult;

    const updated = await prisma.collectionCard.update({
      where: { id },
      data: buildUpdateData(data),
    });
    return NextResponse.json({ merged: false, card: updated });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "PATCH /api/collection/:id");
    return NextResponse.json({ error: "Failed to update collection card" }, { status: 500 });
  }
}

// DELETE /api/collection/[id] — remove a card from collection
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const { id } = await params;

    // Verify ownership
    const card = await prisma.collectionCard.findUnique({ where: { id } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    if (card.userId && card.userId !== result.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.collectionCard.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/collection/:id");
    return NextResponse.json({ error: "Failed to delete collection card" }, { status: 500 });
  }
}
