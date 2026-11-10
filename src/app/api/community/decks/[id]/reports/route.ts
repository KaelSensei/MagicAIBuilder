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

type ReportReason = z.infer<typeof ReportSchema>["reason"];

/** Where the caller's report stands after they submit it. */
type ReportOutcome = "pending" | "closed";

/**
 * Files the caller's report, or replaces the reason of one still pending.
 *
 * A reporter keeps one report per deck (`@@unique([userId, deckId])`). Once a
 * moderator reviews or dismisses it, it stays closed: reporting again changes
 * nothing, so a reporter cannot put the deck back in the queue after every
 * dismissal. Each write is a single statement, so a moderator closing the
 * report between them is never undone.
 *
 * @param userId - the reporter
 * @param deckId - the reported deck
 * @param reason - the reason the reporter chose
 * @returns "pending" while the report waits in the queue, "closed" once a moderator closed it
 */
async function fileReport(
  userId: string,
  deckId: string,
  reason: ReportReason
): Promise<ReportOutcome> {
  const created = await prisma.deckReport.createMany({
    data: [{ userId, deckId, reason }],
    skipDuplicates: true,
  });
  if (created.count > 0) return "pending";

  const replaced = await prisma.deckReport.updateMany({
    where: { userId, deckId, status: "pending" },
    data: { reason },
  });
  return replaced.count > 0 ? "pending" : "closed";
}

/**
 * Submit the caller's private moderation report for a public deck, or replace
 * its reason while it is pending. A closed report is answered 200 and left as
 * the moderator closed it.
 */
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
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 }
      );
    }

    const deck = await findVisibleDeck(id, userId);
    if (!deck?.isPublic) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
    if (deck.userId === userId) {
      return NextResponse.json(
        { error: "You cannot report your own deck" },
        { status: 403 }
      );
    }

    const outcome = await fileReport(userId, id, parsed.data.reason);
    return NextResponse.json(
      { status: outcome },
      { status: outcome === "pending" ? 201 : 200 }
    );
  } catch (error) {
    logger.error(
      "Unexpected error",
      "POST /api/community/decks/:id/reports",
      error
    );
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
