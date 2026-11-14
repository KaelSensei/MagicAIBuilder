import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = await vi.hoisted(async () => {
  const { createAiUsageDb } = await import("@/test/ai-usage-db");
  return createAiUsageDb();
});

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), db);
});

import { resetAiUsageDb } from "@/test/ai-usage-db";
import { aiCallDeniedResponse, reserveAiCallForRoute } from "./route-gate";

const NOW = new Date("2026-11-11T16:00:00.000Z");
const NOVEMBER = new Date("2026-11-01T00:00:00.000Z");
const DECEMBER = new Date("2026-12-01T00:00:00.000Z");
/** 19 days and 8 hours: 11 Nov 16:00 UTC through 1 Dec 00:00 UTC. */
const SECONDS_UNTIL_DECEMBER = 19 * 24 * 60 * 60 + 8 * 60 * 60;

describe("aiCallDeniedResponse", () => {
  it("answers an exhausted allowance with 429, the denial body and Retry-After", async () => {
    const resetsAt = new Date("2026-12-01T00:00:00.000Z");
    const response = aiCallDeniedResponse(
      { code: "allowance_exhausted", route: "suggest", limit: 30, resetsAt },
      NOW
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe(String(SECONDS_UNTIL_DECEMBER));
    expect(await response.json()).toEqual({
      error: "Monthly AI allowance used up",
      code: "allowance_exhausted",
      route: "suggest",
      limit: 30,
      resetsAt: resetsAt.toISOString(),
    });
  });

  it("answers the global spend ceiling with 503", async () => {
    const resetsAt = new Date("2026-12-01T00:00:00.000Z");
    const response = aiCallDeniedResponse(
      { code: "ai_spend_ceiling_reached", resetsAt },
      NOW
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "AI is paused until the monthly budget resets",
      code: "ai_spend_ceiling_reached",
      resetsAt: resetsAt.toISOString(),
    });
  });

  it("rounds a partial second up and reports zero once the reset is in the past", () => {
    const almostTwoSeconds = aiCallDeniedResponse(
      {
        code: "ai_spend_ceiling_reached",
        resetsAt: new Date(NOW.getTime() + 1_001),
      },
      NOW
    );
    const alreadyReset = aiCallDeniedResponse(
      {
        code: "allowance_exhausted",
        route: "build",
        limit: 10,
        resetsAt: new Date(NOW.getTime() - 5_000),
      },
      NOW
    );

    expect(almostTwoSeconds.headers.get("Retry-After")).toBe("2");
    expect(alreadyReset.headers.get("Retry-After")).toBe("0");
  });
});

describe("reserveAiCallForRoute", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    resetAiUsageDb(db);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the reserved ticket when the meter allows the call", async () => {
    const gate = await reserveAiCallForRoute("user-1", "suggest", "POST /api/ai/suggest");

    expect(gate.ok).toBe(true);
    if (!gate.ok) return;
    expect(gate.ticket).toEqual({
      userId: "user-1",
      route: "suggest",
      period: { start: NOVEMBER, resetsAt: DECEMBER },
    });
  });

  it("returns the denial response when the caller's allowance is used up", async () => {
    db.usageCounter.updateMany.mockResolvedValue({ count: 0 });

    const gate = await reserveAiCallForRoute("user-1", "suggest", "POST /api/ai/suggest");

    expect(gate.ok).toBe(false);
    if (gate.ok) return;
    expect(gate.response.status).toBe(429);
    expect(await gate.response.json()).toMatchObject({
      code: "allowance_exhausted",
      route: "suggest",
      limit: 30,
      resetsAt: DECEMBER.toISOString(),
    });
  });

  it("returns the denial response when the month's spend ceiling is already reached", async () => {
    db.aiMonthlySpend.findUnique.mockResolvedValue({
      periodStart: NOVEMBER,
      spentMicroUsd: BigInt(20_000_000),
    });

    const gate = await reserveAiCallForRoute("user-1", "build", "POST /api/ai/build");

    expect(gate.ok).toBe(false);
    if (gate.ok) return;
    expect(gate.response.status).toBe(503);
    expect(await gate.response.json()).toMatchObject({
      code: "ai_spend_ceiling_reached",
      resetsAt: DECEMBER.toISOString(),
    });
    expect(db.usageCounter.updateMany).not.toHaveBeenCalled();
  });

  it("fails closed with 503 and does not call a model when the allowance cannot be read", async () => {
    db.aiMonthlySpend.findUnique.mockRejectedValue(new Error("database unavailable"));

    const gate = await reserveAiCallForRoute(
      "user-1",
      "translate",
      "POST /api/search/translate"
    );

    expect(gate.ok).toBe(false);
    if (gate.ok) return;
    expect(gate.response.status).toBe(503);
    expect(gate.response.headers.get("Retry-After")).toBeNull();
    expect(await gate.response.json()).toEqual({
      error: "AI is unavailable right now",
    });
  });
});
