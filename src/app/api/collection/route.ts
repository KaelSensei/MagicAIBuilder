import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";

const addCardSchema = z.object({
  scryfallId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  foil: z.boolean().default(false),
  condition: z.enum(["NM", "LP", "MP", "HP", "DMG"]).nullable().optional(),
  acquiredAt: z.iso.datetime().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  imageUri: z.string().optional().default(""),
});

// GET /api/collection — list current user's collection cards
export async function GET() {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const cards = await prisma.collectionCard.findMany({
      where: { userId: result.session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cards);
  } catch (error) {
    console.error("[GET /api/collection]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

// POST /api/collection — add a card (upsert by scryfallId+foil+userId)
export async function POST(request: Request) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const body = await request.json();
    const parsed = addCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { scryfallId, name, quantity, foil, condition, acquiredAt, price, imageUri } =
      parsed.data;
    const userId = result.session.user.id;

    // Upsert: if the same card+foil+user variant already exists, increment quantity
    const existing = await prisma.collectionCard.findUnique({
      where: { scryfallId_foil_userId: { scryfallId, foil, userId } },
    });

    if (existing) {
      const updated = await prisma.collectionCard.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      return NextResponse.json(updated);
    }

    const card = await prisma.collectionCard.create({
      data: {
        scryfallId,
        name,
        quantity,
        foil,
        condition: condition ?? null,
        acquiredAt: acquiredAt ? new Date(acquiredAt) : null,
        price: price ?? null,
        imageUri,
        userId,
      },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("[POST /api/collection]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to add card to collection" }, { status: 500 });
  }
}
