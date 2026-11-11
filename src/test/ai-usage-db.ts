import { vi } from "vitest";

/**
 * Stand-ins for the Prisma delegates AI metering uses, for tests that mock
 * `@/lib/db/prisma`.
 *
 * @returns delegates answering as for a user with allowance left in a month
 *   under its spend ceiling
 */
export function createAiUsageDb() {
  const db = {
    usageCounter: {
      createMany: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    aiMonthlySpend: { findUnique: vi.fn(), upsert: vi.fn() },
    aiUsage: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  resetAiUsageDb(db);
  return db;
}

/** The delegates `createAiUsageDb` returns. */
export type AiUsageDb = ReturnType<typeof createAiUsageDb>;

/**
 * Clears recorded calls and restores the default answers.
 *
 * @param db - delegates from `createAiUsageDb`
 */
export function resetAiUsageDb(db: AiUsageDb): void {
  db.usageCounter.createMany.mockReset().mockResolvedValue({ count: 1 });
  db.usageCounter.updateMany.mockReset().mockResolvedValue({ count: 1 });
  db.usageCounter.findMany.mockReset().mockResolvedValue([]);
  db.aiMonthlySpend.findUnique.mockReset().mockResolvedValue(null);
  db.aiMonthlySpend.upsert.mockReset().mockResolvedValue({
    periodStart: new Date("2026-11-01T00:00:00.000Z"),
    spentMicroUsd: BigInt(0),
  });
  db.aiUsage.create.mockReset().mockResolvedValue({});
  db.$transaction
    .mockReset()
    .mockImplementation((operations: readonly Promise<unknown>[]) =>
      Promise.all(operations)
    );
}
