import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const REPORT_PAGE_SIZE = 50;

/** Return the bounded pending-report queue to authorized moderators. */
export async function GET(_request: Request) {
  try {
    const authorization = await requireModerator();
    if (authorization.error) return authorization.error;

    const reports = await prisma.deckReport.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: REPORT_PAGE_SIZE,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        deck: { select: { id: true, name: true, user: { select: { username: true } } } },
        user: { select: { username: true } },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    logger.error("Unexpected error", "GET /api/moderation/deck-reports", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
