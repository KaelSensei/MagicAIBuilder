import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";

const patchSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  condition: z.enum(["NM", "LP", "MP", "HP", "DMG"]).nullable().optional(),
  foil: z.boolean().optional(),
  price: z.number().positive().nullable().optional(),
  acquiredAt: z.iso.datetime().nullable().optional(),
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
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/collection/:id]", error instanceof Error ? error.message : "unknown");
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
    console.error("[DELETE /api/collection/:id]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to delete collection card" }, { status: 500 });
  }
}
