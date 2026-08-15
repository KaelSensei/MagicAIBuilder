import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/health
 * Returns the application and database health status.
 * Used by uptime monitors (UptimeRobot, etc.).
 *
 * The endpoint is unauthenticated, so the failure branch reports only that the
 * database is unreachable — the driver's message can name hosts, users and
 * credentials. The detail goes to the logs and to Sentry instead.
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
    logger.error("Database health check failed", "GET /api/health", error);

    return NextResponse.json(
      {
        status: "degraded",
        db: "unreachable",
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
