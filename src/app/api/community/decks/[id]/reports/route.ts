import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { findVisibleDeck } from "@/lib/community/visible-deck";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

const ReportSchema = z.object({
  reason: z.enum(["spam", "harassment", "illegal_content", "other"]),
});

/** Submit or replace the caller's private moderation report for a public deck. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = ReportSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report reason" }, { status: 400 });
    }

    const deck = await findVisibleDeck(id, userId);
    if (!deck || !deck.isPublic) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
    if (deck.userId === userId) {
      return NextResponse.json({ error: "You cannot report your own deck" }, { status: 403 });
    }

    await prisma.deckReport.upsert({
      where: { userId_deckId: { userId, deckId: id } },
      update: { reason: parsed.data.reason, status: "pending" },
      create: { userId, deckId: id, reason: parsed.data.reason },
    });
    return NextResponse.json({ status: "pending" }, { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/decks/:id/reports", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
