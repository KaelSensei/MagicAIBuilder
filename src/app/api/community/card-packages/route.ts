import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const PackageCardSchema = z.object({
  scryfallId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
  colorIdentity: z.array(z.enum(["W", "U", "B", "R", "G", "C"])).max(6),
  isBanned: z.boolean().optional().default(false),
  isBasicLand: z.boolean().optional().default(false),
  imageUri: z.string().url().or(z.literal("")).optional().default(""),
});

const CreatePackageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().default(""),
  category: z.enum(["mana-base", "interaction", "tribal", "combo", "other"]),
  isPublic: z.boolean().optional().default(false),
  cards: z.array(PackageCardSchema).min(1).max(100),
});

type PackageCard = z.infer<typeof PackageCardSchema>;

/** Combine repeated printings while preserving the first card's metadata. */
function normalizeCards(cards: readonly PackageCard[]): readonly PackageCard[] {
  const normalized = new Map<string, PackageCard>();
  for (const card of cards) {
    const existing = normalized.get(card.scryfallId);
    normalized.set(
      card.scryfallId,
      existing ? { ...existing, quantity: existing.quantity + card.quantity } : card
    );
  }
  return [...normalized.values()];
}

/** List recently updated public packages with stable author attribution. */
export async function GET() {
  try {
    const packages = await prisma.cardPackage.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        updatedAt: true,
        author: { select: { username: true, name: true } },
        cards: {
          orderBy: { name: "asc" },
          select: {
            scryfallId: true,
            name: true,
            quantity: true,
            colorIdentity: true,
            isBanned: true,
            isBasicLand: true,
            imageUri: true,
          },
        },
      },
    });
    return NextResponse.json(packages);
  } catch (error) {
    logger.error("Unexpected error", "GET /api/community/card-packages", error);
    return NextResponse.json({ error: "Failed to load card packages" }, { status: 500 });
  }
}

/** Create a reusable package owned and attributed to the authenticated author. */
export async function POST(request: Request) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = CreatePackageSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid card package" }, { status: 400 });
    }

    const cardPackage = await prisma.cardPackage.create({
      data: {
        authorId: authentication.session.user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category,
        isPublic: parsed.data.isPublic,
        cards: { create: [...normalizeCards(parsed.data.cards)] },
      },
      select: { id: true, name: true, category: true, isPublic: true, createdAt: true },
    });
    return NextResponse.json(cardPackage, { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/card-packages", error);
    return NextResponse.json({ error: "Failed to create card package" }, { status: 500 });
  }
}
