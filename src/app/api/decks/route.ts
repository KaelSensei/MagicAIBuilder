import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";

const createDeckSchema = z.object({
  name: z.string().min(1).max(200),
  format: z.enum(["commander", "brawl"]).optional().default("commander"),
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

// GET /api/decks — list current user's decks
export async function GET() {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const decks = await prisma.deck.findMany({
      where: { userId: result.session.user.id },
      include: { cards: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(decks);
  } catch (error) {
    console.error("[GET /api/decks]", error instanceof Error ? error.message : "unknown");
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
    console.error("[POST /api/decks]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
