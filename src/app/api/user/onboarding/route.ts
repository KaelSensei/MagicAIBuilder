import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

// GET /api/user/onboarding — read onboarding status for current user
export async function GET() {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const user = await prisma.user.findUnique({
      where: { id: result.session.user.id },
      select: { onboardingDone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ onboardingDone: user.onboardingDone });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/user/onboarding"
    );
    return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 });
  }
}

// POST /api/user/onboarding — mark onboarding as done
export async function POST() {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    await prisma.user.update({
      where: { id: result.session.user.id },
      data: { onboardingDone: true },
    });

    return NextResponse.json({ onboardingDone: true });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/user/onboarding"
    );
    return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
  }
}

// DELETE /api/user/onboarding — reset onboarding (replay tutorial)
export async function DELETE() {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    await prisma.user.update({
      where: { id: result.session.user.id },
      data: { onboardingDone: false },
    });

    return NextResponse.json({ onboardingDone: false });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "DELETE /api/user/onboarding"
    );
    return NextResponse.json({ error: "Failed to reset onboarding status" }, { status: 500 });
  }
}
