import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const addCardSchema = z.object({
  scryfallId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  foil: z.boolean().default(false),
  condition: z.enum(["NM", "LP", "MP", "HP", "DMG"]).nullable().optional(),
  acquiredAt: z.string().datetime().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  imageUri: z.string().optional().default(""),
});

// GET /api/collection — list all collection cards
export async function GET() {
  try {
    const cards = await prisma.collectionCard.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cards);
  } catch (error) {
    console.error("[GET /api/collection]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

// POST /api/collection — add a card (upsert by scryfallId+foil)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = addCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scryfallId, name, quantity, foil, condition, acquiredAt, price, imageUri } =
      parsed.data;

    // Upsert: if the same card+foil variant already exists, increment quantity
    const existing = await prisma.collectionCard.findUnique({
      where: { scryfallId_foil: { scryfallId, foil } },
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
      },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("[POST /api/collection]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to add card to collection" }, { status: 500 });
  }
}
