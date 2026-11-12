import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { withRequestLog } from "@/lib/api/route-kit";

/**
 * GET /api/user/init — combined bootstrap endpoint.
 * Returns onboarding status + collection in a single request
 * with parallel DB queries, replacing two separate round-trips.
 *
 * @returns JSON with { onboardingDone, collection }
 */
export async function GET() {
  return withRequestLog(
    { message: "User init request completed", context: "GET /api/user/init" },
    loadUserInit
  );
}

/**
 * Loads onboarding status and the collection for the signed-in user.
 *
 * @returns The bootstrap payload, or a JSON error with the matching status.
 */
async function loadUserInit(): Promise<NextResponse> {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const userId = result.session.user.id;

    const [user, collection] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { onboardingDone: true },
      }),
      prisma.collectionCard.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      onboardingDone: user.onboardingDone,
      collection,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/user/init"
    );
    return NextResponse.json({ error: "Failed to initialize user data" }, { status: 500 });
  }
}
