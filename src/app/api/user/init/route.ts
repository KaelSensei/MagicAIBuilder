import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

/**
 * GET /api/user/init — combined bootstrap endpoint.
 * Returns onboarding status + collection in a single request
 * with parallel DB queries, replacing two separate round-trips.
 *
 * @returns JSON with { onboardingDone, collection }
 */
export async function GET() {
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

    return NextResponse.json({
      onboardingDone: user?.onboardingDone ?? false,
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
