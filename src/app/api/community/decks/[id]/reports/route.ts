/**
 * Moderation reports on a community deck: `/api/community/decks/[id]/reports`.
 *
 * POST — file the caller's private report, or replace the reason of one still
 * pending. A closed report is answered 200 and left as the moderator closed it.
 *
 * HTTP only: session, body parsing and the status for each outcome. The rules
 * live in `reportDeck` (`@/lib/community/deck-report-use-cases`). The reasons
 * are `REPORT_REASONS` from the community contracts, the one list the client
 * and this schema share (#1491).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { REPORT_REASONS } from "@/lib/community/community-contracts";
import { reportUseCasePorts } from "@/lib/community/deck-action-server";
import {
  reportDeck,
  type ReportDeckResult,
} from "@/lib/community/deck-report-use-cases";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

const ReportSchema = z.object({ reason: z.enum(REPORT_REASONS) });

/** 201 for a report now in the queue, 200 for one a moderator already closed. */
function reportResponse(result: ReportDeckResult) {
  switch (result.kind) {
    case "filed":
      return NextResponse.json(
        { status: result.status },
        { status: result.status === "pending" ? 201 : 200 }
      );
    case "not-found":
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    case "own-deck":
      return NextResponse.json(
        { error: "You cannot report your own deck" },
        { status: 403 }
      );
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

// POST /api/community/decks/[id]/reports
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const reporterId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = ReportSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 }
      );
    }

    const command = { deckId: id, reporterId, reason: parsed.data.reason };
    return reportResponse(await reportDeck(command, reportUseCasePorts));
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
