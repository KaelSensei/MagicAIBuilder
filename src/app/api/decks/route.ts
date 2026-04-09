import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { ALL_FORMATS } from "@/lib/deck/formats";

/** Max decks per page for the listing endpoint */
const MAX_PAGE_SIZE = 50;
/** Default decks per page */
const DEFAULT_PAGE_SIZE = 20;

const createDeckSchema = z.object({
  name: z.string().min(1).max(200),
  format: z.enum(ALL_FORMATS).optional().default("commander"),
  targetBracket: z.number().int().min(1).max(4).optional().default(3),
  budget: z.number().positive().nullable().optional(),
  commanderId: z.string().nullable().optional(),
  partnerId: z.string().nullable().optional(),
  companionId: z.string().nullable().optional(),
  pairingType: z
    .enum(["none", "partner", "partner_with", "friends_forever", "background", "doctor", "character_select"])
    .optional()
    .default("none"),
  isAIGenerated: z.boolean().optional().default(false),
});

// GET /api/decks — paginated lightweight listing (commander/partner/companion only + card count)
export async function GET(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const { searchParams } = request.nextUrl;
    const page = Math.max(0, Number(searchParams.get("page") ?? "0"));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE))));
    const userId = result.session.user.id;

    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where: { userId },
        include: {
          cards: {
            where: {
              OR: [
                { isCommander: true },
                { isPartner: true },
                { category: "companion" },
              ],
            },
            select: {
              id: true,
              scryfallId: true,
              name: true,
              manaCost: true,
              cmc: true,
              typeLine: true,
              oracleText: true,
              colorIdentity: true,
              isGameChanger: true,
              isBanned: true,
              price: true,
              imageUri: true,
              artCropUri: true,
              category: true,
              isCommander: true,
              isPartner: true,
              power: true,
              toughness: true,
              quantity: true,
              notes: true,
              zone: true,
            },
            distinct: ["scryfallId", "isCommander", "isPartner"],
            take: 3,
          },
          _count: { select: { cards: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: page * limit,
        take: limit,
      }),
      prisma.deck.count({ where: { userId } }),
    ]);

    return NextResponse.json({ decks, total, page, limit });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/decks");
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}

// POST /api/decks — create a new deck
export async function POST(request: Request) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const body = await request.json();
    const parsed = createDeckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues.map((i) => i.message) }, { status: 400 });
    }
    const { name: rawName, format, targetBracket, budget, commanderId, partnerId, companionId, pairingType, isAIGenerated } = parsed.data;
    // Bounded quantifier prevents ReDoS on HTML tag stripping
    const sanitizedName = rawName.replaceAll(/<[^>]{0,200}>/g, "").trim();
    if (!sanitizedName) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const deck = await prisma.deck.create({
      data: {
        name: sanitizedName,
        format,
        targetBracket,
        budget: budget ?? null,
        commanderId: commanderId ?? null,
        partnerId: partnerId ?? null,
        companionId: companionId ?? null,
        pairingType,
        isAIGenerated: isAIGenerated ?? false,
        userId: result.session.user.id,
      },
      include: { cards: true },
    });
    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks");
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
