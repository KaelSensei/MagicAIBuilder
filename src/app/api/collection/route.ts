import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";

/** Prisma's error code for a unique-constraint violation. */
const UNIQUE_CONSTRAINT = "P2002";

/**
 * True when a write lost a race to a concurrent insert of the same printing.
 *
 * @param error - rejection from a Prisma write
 * @returns whether the error is a unique-constraint violation
 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNIQUE_CONSTRAINT
  );
}

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
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/collection");
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

// POST /api/collection — add a card (upsert by scryfallId+foil+userId)
export async function POST(request: Request) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const body = jsonBody.value;
    const parsed = addCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const saved = await saveCollectionCard(result.session.user.id, parsed.data);
    if (saved.created) return NextResponse.json(saved.card, { status: 201 });
    return NextResponse.json(saved.card);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/collection");
    return NextResponse.json({ error: "Failed to add card to collection" }, { status: 500 });
  }
}

type AddCardInput = z.infer<typeof addCardSchema>;

/**
 * Inserts a collection row, or increments quantity when that printing already exists.
 *
 * The create path handles a unique-constraint race: two requests can both miss
 * `findUnique` and both insert. The loser increments the row the winner wrote
 * instead of failing the request.
 *
 * @param userId - owner of the collection
 * @param input - validated card payload
 * @returns the stored row and whether this call created it
 */
async function saveCollectionCard(userId: string, input: AddCardInput) {
  const { scryfallId, name, quantity, foil, condition, acquiredAt, price, imageUri } = input;
  const where = { scryfallId_foil_userId: { scryfallId, foil, userId } };
  const existing = await prisma.collectionCard.findUnique({ where });

  if (existing) {
    const card = await prisma.collectionCard.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
    return { card, created: false };
  }

  try {
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
    return { card, created: true };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const card = await prisma.collectionCard.update({
      where,
      data: { quantity: { increment: quantity } },
    });
    return { card, created: false };
  }
}
