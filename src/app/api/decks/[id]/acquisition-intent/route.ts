import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import type { RouteParams } from "@/lib/api/route-kit";

const IntentSchema = z.object({
  scryfallId: z.string().min(1).max(100),
  mode: z.enum(["proxy_now", "buy_later", "buy_now"]),
});

/** List the saved acquisition intentions for one private deck. */
export async function GET(_request: Request, context: RouteParams<"id">) {
  try {
    const { id: deckId } = await context.params;
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const intents = await prisma.acquisitionIntent.findMany({
      where: { userId: ownership.userId, deckId },
      select: { scryfallId: true, mode: true },
    });
    return NextResponse.json({ intents });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/decks/[id]/acquisition-intent");
    return NextResponse.json({ error: "Failed to load acquisition intents" }, { status: 500 });
  }
}

/** Persist or clear a player's reversible acquisition intention for one printing. */
export async function PUT(request: Request, context: RouteParams<"id">) {
  const { id: deckId } = await context.params;
  const ownership = await requireDeckOwner(deckId);
  if (ownership.error) return ownership.error;

  const parsed = IntentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid acquisition intent" }, { status: 400 });
  }

  const { scryfallId, mode } = parsed.data;
  const key = { userId: ownership.userId, deckId, scryfallId };

  try {
    if (mode === "buy_now") {
      await prisma.acquisitionIntent.delete({ where: { userId_deckId_scryfallId: key } }).catch(() => null);
      return NextResponse.json({ mode });
    }

    await prisma.acquisitionIntent.upsert({
      where: { userId_deckId_scryfallId: key },
      create: { ...key, mode },
      update: { mode },
    });
    return NextResponse.json({ mode });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "PUT /api/decks/[id]/acquisition-intent");
    return NextResponse.json({ error: "Failed to save acquisition intent" }, { status: 500 });
  }
}
