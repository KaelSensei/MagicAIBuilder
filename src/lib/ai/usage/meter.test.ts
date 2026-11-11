import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = await vi.hoisted(async () => {
  const { createAiUsageDb } = await import("@/test/ai-usage-db");
  return createAiUsageDb();
});

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));

import { logger } from "@/lib/logger";
import { resetAiUsageDb } from "@/test/ai-usage-db";
import {
  readAiAllowance,
  recordPlaceholderAnswer,
  reserveAiCall,
  settleAiCall,
  type AiCallTicket,
} from "./meter";

const NOVEMBER = new Date("2026-11-01T00:00:00.000Z");
const DECEMBER = new Date("2026-12-01T00:00:00.000Z");
const MID_NOVEMBER = new Date("2026-11-09T12:00:00.000Z");

const TICKET: AiCallTicket = {
  userId: "user-1",
  route: "build",
  period: { start: NOVEMBER, resetsAt: DECEMBER },
};

const HAIKU_CALL = {
  provider: "anthropic",
  model: "claude-haiku-4-5",
  usage: {
    inputTokens: 1_200,
    outputTokens: 1_500,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  },
} as const;

describe("AI usage meter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAiUsageDb(db);
  });

  afterEach(() => {
    delete process.env.AI_MONTHLY_BUILD_ALLOWANCE;
    delete process.env.AI_MONTHLY_SPEND_CEILING_USD;
  });

  describe("reserveAiCall", () => {
    it("claims one unit with a single update bounded by the route's monthly allowance", async () => {
      const gate = await reserveAiCall("user-1", "build", MID_NOVEMBER);

      expect(gate).toEqual({ ok: true, ticket: TICKET });
      expect(db.usageCounter.createMany).toHaveBeenCalledWith({
        data: [
          { userId: "user-1", key: "ai.build", periodStart: NOVEMBER, used: 0 },
        ],
        skipDuplicates: true,
      });
      expect(db.usageCounter.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          key: "ai.build",
          periodStart: NOVEMBER,
          used: { lt: 10 },
        },
        data: { used: { increment: 1 } },
      });
    });

    it("reads the allowance from the environment", async () => {
      process.env.AI_MONTHLY_BUILD_ALLOWANCE = "2";

      await reserveAiCall("user-1", "build", MID_NOVEMBER);

      expect(db.usageCounter.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ used: { lt: 2 } }),
        })
      );
    });

    it("denies the call with the limit and the reset date when no unit is left", async () => {
      db.usageCounter.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        reserveAiCall("user-1", "suggest", MID_NOVEMBER)
      ).resolves.toEqual({
        ok: false,
        denial: {
          code: "allowance_exhausted",
          route: "suggest",
          limit: 30,
          resetsAt: DECEMBER,
        },
      });
    });

    it("denies every call once the month's spend reaches the ceiling, without taking a unit", async () => {
      db.aiMonthlySpend.findUnique.mockResolvedValue({
        periodStart: NOVEMBER,
        spentMicroUsd: BigInt(20_000_000),
      });

      await expect(
        reserveAiCall("user-1", "build", MID_NOVEMBER)
      ).resolves.toEqual({
        ok: false,
        denial: { code: "ai_spend_ceiling_reached", resetsAt: DECEMBER },
      });
      expect(db.aiMonthlySpend.findUnique).toHaveBeenCalledWith({
        where: { periodStart: NOVEMBER },
      });
      expect(db.usageCounter.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("settleAiCall", () => {
    it("records the call's tokens, outcome and cost, adds the cost to the month's spend and keeps the unit", async () => {
      await settleAiCall(TICKET, {
        ...HAIKU_CALL,
        stopReason: "end_turn",
        outcome: "ok",
      });

      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          route: "build",
          provider: "anthropic",
          model: "claude-haiku-4-5",
          inputTokens: 1_200,
          outputTokens: 1_500,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          stopReason: "end_turn",
          outcome: "ok",
          costMicroUsd: 8_700,
          priceTableVersion: "2026-11-09",
          countsAgainstAllowance: true,
        },
      });
      expect(db.aiMonthlySpend.upsert).toHaveBeenCalledWith({
        where: { periodStart: NOVEMBER },
        create: { periodStart: NOVEMBER, spentMicroUsd: 8_700 },
        update: { spentMicroUsd: { increment: 8_700 } },
      });
      expect(db.usageCounter.updateMany).not.toHaveBeenCalled();
    });

    it("gives the unit back for a truncated reply and still records what it cost", async () => {
      await settleAiCall(TICKET, {
        ...HAIKU_CALL,
        stopReason: "max_tokens",
        outcome: "truncated",
      });

      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          outcome: "truncated",
          stopReason: "max_tokens",
          costMicroUsd: 8_700,
          countsAgainstAllowance: false,
        }),
      });
      expect(db.usageCounter.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          key: "ai.build",
          periodStart: NOVEMBER,
          used: { gt: 0 },
        },
        data: { used: { decrement: 1 } },
      });
    });

    // The unit was taken from November; a reply that lands on 1 December must
    // not hand a December unit back.
    it("gives the unit back to the month it was taken from", async () => {
      vi.useFakeTimers({ now: DECEMBER });
      try {
        await settleAiCall(TICKET, {
          ...HAIKU_CALL,
          stopReason: null,
          outcome: "providerError",
        });
      } finally {
        vi.useRealTimers();
      }

      expect(db.usageCounter.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ periodStart: NOVEMBER }),
        })
      );
    });

    it("alerts the owner once, on the call that takes the month over the ceiling", async () => {
      const logError = vi.spyOn(logger, "error").mockImplementation(() => {});
      db.aiMonthlySpend.upsert
        .mockResolvedValueOnce({
          periodStart: NOVEMBER,
          spentMicroUsd: BigInt(20_000_100),
        })
        .mockResolvedValueOnce({
          periodStart: NOVEMBER,
          spentMicroUsd: BigInt(20_008_800),
        });
      const call = {
        ...HAIKU_CALL,
        stopReason: "end_turn",
        outcome: "ok",
      } as const;

      await settleAiCall(TICKET, call);
      await settleAiCall(TICKET, call);

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith(
        "AI monthly spend ceiling reached: AI calls are off until 2026-12-01T00:00:00.000Z",
        "ai-usage"
      );
    });

    it("logs a ledger failure instead of failing an answer the user already paid for", async () => {
      const logError = vi.spyOn(logger, "error").mockImplementation(() => {});
      const failure = new Error("database unavailable");
      db.$transaction.mockRejectedValue(failure);

      await expect(
        settleAiCall(TICKET, {
          ...HAIKU_CALL,
          stopReason: "end_turn",
          outcome: "ok",
        })
      ).resolves.toBeUndefined();
      expect(logError).toHaveBeenCalledWith(
        "AI usage could not be recorded",
        "ai-usage",
        failure
      );
    });

    it("still gives the unit back for a failed call when the ledger write fails", async () => {
      vi.spyOn(logger, "error").mockImplementation(() => {});
      db.$transaction.mockRejectedValue(new Error("database unavailable"));

      await settleAiCall(TICKET, {
        ...HAIKU_CALL,
        stopReason: "max_tokens",
        outcome: "truncated",
      });

      expect(db.usageCounter.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { used: { decrement: 1 } } })
      );
    });
  });

  describe("recordPlaceholderAnswer", () => {
    it("records the placeholder at zero cost without touching the allowance", async () => {
      await recordPlaceholderAnswer("user-1", "build");

      expect(db.aiUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          route: "build",
          provider: "placeholder",
          model: "placeholder",
          outcome: "ok",
          costMicroUsd: 0,
          countsAgainstAllowance: false,
        }),
      });
      expect(db.usageCounter.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("readAiAllowance", () => {
    it("reports what remains on each route this month and when it resets", async () => {
      db.usageCounter.findMany.mockResolvedValue([
        { key: "ai.build", used: 3 },
      ]);

      await expect(readAiAllowance("user-1", MID_NOVEMBER)).resolves.toEqual({
        periodStart: NOVEMBER,
        resetsAt: DECEMBER,
        aiAvailable: true,
        routes: {
          build: { limit: 10, used: 3, remaining: 7 },
          suggest: { limit: 30, used: 0, remaining: 30 },
        },
      });
      expect(db.usageCounter.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", periodStart: NOVEMBER },
        select: { key: true, used: true },
      });
    });

    it("reports AI as unavailable once the month's spend reaches the ceiling", async () => {
      db.aiMonthlySpend.findUnique.mockResolvedValue({
        periodStart: NOVEMBER,
        spentMicroUsd: BigInt(20_000_000),
      });

      const allowance = await readAiAllowance("user-1", MID_NOVEMBER);

      expect(allowance.aiAvailable).toBe(false);
    });
  });
});
