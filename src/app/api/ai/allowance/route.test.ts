import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));
const db = await vi.hoisted(async () => {
  const { createAiUsageDb } = await import("@/test/ai-usage-db");
  return createAiUsageDb();
});

vi.mock(import("@/lib/auth/helpers"), () => ({
  requireAuth: mocks.requireAuth,
}));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), db);
});

import { logger } from "@/lib/logger";
import { resetAiUsageDb } from "@/test/ai-usage-db";
import { GET } from "./route";

describe("GET /api/ai/allowance", () => {
  beforeEach(() => {
    resetAiUsageDb(db);
    mocks.requireAuth.mockResolvedValue({
      session: { user: { id: "user-1" } },
      error: null,
    });
    vi.useFakeTimers({
      now: new Date("2026-11-09T12:00:00.000Z"),
      toFake: ["Date"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reports what the caller has left on each AI route this month and when it resets", async () => {
    db.usageCounter.findMany.mockResolvedValue([
      { key: "ai.build", used: 4 },
      { key: "ai.suggest", used: 30 },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      periodStart: "2026-11-01T00:00:00.000Z",
      resetsAt: "2026-12-01T00:00:00.000Z",
      aiAvailable: true,
      routes: {
        build: { limit: 10, used: 4, remaining: 6 },
        suggest: { limit: 30, used: 30, remaining: 0 },
        translate: { limit: 60, used: 0, remaining: 60 },
      },
    });
    expect(db.usageCounter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      })
    );
  });

  it("requires a session", async () => {
    mocks.requireAuth.mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(db.usageCounter.findMany).not.toHaveBeenCalled();
  });

  it("answers 503 when the allowance cannot be read", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
    db.usageCounter.findMany.mockRejectedValue(
      new Error("database unavailable")
    );

    const response = await GET();

    expect(response.status).toBe(503);
  });
});
