import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireModerator } from "@/lib/auth/require-moderator";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

type Params = { readonly params: Promise<{ readonly reportId: string }> };

const ReviewSchema = z.object({ status: z.enum(["reviewed", "dismissed"]) });

/** Resolve one pending report while retaining the moderator audit trail. */
export async function PATCH(request: Request, { params }: Params) {
  const { reportId } = await params;
  try {
    const authorization = await requireModerator();
    if (authorization.error) return authorization.error;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = ReviewSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report status" }, { status: 400 });
    }

    const result = await prisma.deckReport.updateMany({
      where: { id: reportId, status: "pending" },
      data: {
        status: parsed.data.status,
        reviewedById: authorization.moderatorId,
        reviewedAt: new Date(),
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ status: parsed.data.status });
  } catch (error) {
    logger.error("Unexpected error", "PATCH /api/moderation/deck-reports/:reportId", error);
    return NextResponse.json({ error: "Failed to review report" }, { status: 500 });
  }
}
