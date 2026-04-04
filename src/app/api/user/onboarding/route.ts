import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

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
