import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/health
 * Returns the application and database health status.
 * Used by uptime monitors (UptimeRobot, etc.).
 */
export async function GET() {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        db: "ok",
        latencyMs: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        db: "unreachable",
        error: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
