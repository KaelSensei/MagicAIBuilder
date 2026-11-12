import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readAiAllowance } from "@/lib/ai/usage/meter";

export const runtime = "nodejs";

/**
 * Reports the caller's AI allowance for the current UTC month: per route the
 * limit, the calls used and the calls left, plus the reset instant and whether
 * AI is on at all (false once the global spend ceiling is reached).
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const allowance = await readAiAllowance(auth.session.user.id);
    return NextResponse.json(allowance, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logger.error("AI allowance unavailable", "GET /api/ai/allowance", error);
    return NextResponse.json(
      { error: "AI allowance unavailable" },
      { status: 503 }
    );
  }
}
