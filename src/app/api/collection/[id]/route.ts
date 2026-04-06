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

// PATCH /api/collection/[id] — update quantity/condition/etc
export async function PATCH(
  request: Request,
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

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If quantity is set to 0, delete instead
    if (data.quantity === 0) {
      await prisma.collectionCard.delete({ where: { id } });
      return NextResponse.json({ deleted: true });
    }

    // Swap printing/art (scryfallId) — may merge into an existing row with same (scryfallId, foil, userId)
    if (data.scryfallId && data.scryfallId !== card.scryfallId) {
      const existing = await prisma.collectionCard.findUnique({
        where: {
          scryfallId_foil_userId: {
            scryfallId: data.scryfallId,
            foil: data.foil ?? card.foil,
            userId: result.session.user.id,
          },
        },
      });

      // If an existing row matches the target printing, merge quantities and delete the current row.
      if (existing) {
        const merged = await prisma.collectionCard.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + (data.quantity ?? card.quantity),
            ...(data.condition !== undefined && { condition: data.condition }),
            ...(data.price !== undefined && { price: data.price }),
            ...(data.acquiredAt !== undefined && {
              acquiredAt: data.acquiredAt ? new Date(data.acquiredAt) : null,
            }),
            ...(data.name !== undefined && { name: data.name }),
            ...(data.imageUri !== undefined && { imageUri: data.imageUri }),
          },
        });

        await prisma.collectionCard.delete({ where: { id } });

        return NextResponse.json({ merged: true, mergedFromId: id, card: merged });
      }
    }

    const updated = await prisma.collectionCard.update({
      where: { id },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.foil !== undefined && { foil: data.foil }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.acquiredAt !== undefined && {
          acquiredAt: data.acquiredAt ? new Date(data.acquiredAt) : null,
        }),
        ...(data.scryfallId !== undefined && { scryfallId: data.scryfallId }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.imageUri !== undefined && { imageUri: data.imageUri }),
      },
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
