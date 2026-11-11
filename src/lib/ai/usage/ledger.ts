/**
 * The PostgreSQL side of AI metering: the per-user monthly counters, the
 * month's global spend and the usage ledger. Every write that guards money is
 * a single statement, so it holds across instances without an in-process lock.
 */
import { prisma } from "@/lib/db/prisma";
import type { AiCallOutcome, AiRoute } from "./policy";
import type { TokenUsage } from "./prices";

/** The counter key for a route's monthly allowance, e.g. `ai.build`. */
function allowanceKey(route: AiRoute): string {
  return `ai.${route}`;
}

/**
 * Takes one unit of a user's monthly allowance on a route, if one is left.
 *
 * The row is created first with `ON CONFLICT DO NOTHING`, then claimed with
 * one `UPDATE … SET used = used + 1 WHERE … AND used < limit`. Under
 * PostgreSQL's default isolation a second instance updating the same row
 * waits for the first and re-checks `used < limit` against the new value, so
 * at `limit − 1` exactly one of two concurrent calls gets the unit.
 *
 * @param userId - the caller
 * @param route - the metered route
 * @param periodStart - first instant of the UTC month
 * @param limit - calls allowed this month
 * @returns true when a unit was taken
 */
export async function claimAllowanceUnit(
  userId: string,
  route: AiRoute,
  periodStart: Date,
  limit: number
): Promise<boolean> {
  const key = allowanceKey(route);
  await prisma.usageCounter.createMany({
    data: [{ userId, key, periodStart, used: 0 }],
    skipDuplicates: true,
  });
  const { count } = await prisma.usageCounter.updateMany({
    where: { userId, key, periodStart, used: { lt: limit } },
    data: { used: { increment: 1 } },
  });
  return count === 1;
}

/**
 * Gives back a unit taken by `claimAllowanceUnit`, never below zero.
 *
 * @param userId - the caller
 * @param route - the metered route
 * @param periodStart - the month the unit was taken from
 */
export async function releaseAllowanceUnit(
  userId: string,
  route: AiRoute,
  periodStart: Date
): Promise<void> {
  await prisma.usageCounter.updateMany({
    where: { userId, key: allowanceKey(route), periodStart, used: { gt: 0 } },
    data: { used: { decrement: 1 } },
  });
}

/**
 * Reads how many calls a user made on each route this month.
 *
 * @param userId - the caller
 * @param periodStart - first instant of the UTC month
 * @returns calls used per route; a route without a row has used none
 */
export async function readAllowanceUsed(
  userId: string,
  periodStart: Date
): Promise<Readonly<Record<AiRoute, number>>> {
  const rows = await prisma.usageCounter.findMany({
    where: { userId, periodStart },
    select: { key: true, used: true },
  });
  const usedByKey = new Map(rows.map((row) => [row.key, row.used]));
  return {
    build: usedByKey.get(allowanceKey("build")) ?? 0,
    suggest: usedByKey.get(allowanceKey("suggest")) ?? 0,
    translate: usedByKey.get(allowanceKey("translate")) ?? 0,
  };
}

/**
 * Reads what all metered calls cost this month.
 *
 * @param periodStart - first instant of the UTC month
 * @returns the month's spend in micro-dollars
 */
export async function readMonthlySpend(periodStart: Date): Promise<bigint> {
  const row = await prisma.aiMonthlySpend.findUnique({
    where: { periodStart },
  });
  return row?.spentMicroUsd ?? BigInt(0);
}

/** One ledger row, as `writeUsage` stores it. */
export interface UsageRow {
  readonly userId: string;
  readonly route: AiRoute;
  readonly provider: string;
  readonly model: string;
  readonly usage: TokenUsage;
  readonly stopReason: string | null;
  readonly outcome: AiCallOutcome;
  readonly costMicroUsd: number;
  readonly priceTableVersion: string;
  readonly countsAgainstAllowance: boolean;
}

/**
 * Stores a ledger row and adds its cost to the month's spend, together.
 *
 * The spend is an `INSERT … ON CONFLICT DO UPDATE` increment, so concurrent
 * calls add up instead of overwriting each other.
 *
 * @param row - the call to record
 * @param periodStart - the month the cost belongs to
 * @returns the month's spend after this call, in micro-dollars
 */
export async function writeUsage(
  row: UsageRow,
  periodStart: Date
): Promise<bigint> {
  const [, spend] = await prisma.$transaction([
    prisma.aiUsage.create({
      data: {
        userId: row.userId,
        route: row.route,
        provider: row.provider,
        model: row.model,
        inputTokens: row.usage.inputTokens,
        outputTokens: row.usage.outputTokens,
        cacheReadTokens: row.usage.cacheReadTokens,
        cacheWriteTokens: row.usage.cacheWriteTokens,
        stopReason: row.stopReason,
        outcome: row.outcome,
        costMicroUsd: row.costMicroUsd,
        priceTableVersion: row.priceTableVersion,
        countsAgainstAllowance: row.countsAgainstAllowance,
      },
    }),
    prisma.aiMonthlySpend.upsert({
      where: { periodStart },
      create: { periodStart, spentMicroUsd: row.costMicroUsd },
      update: { spentMicroUsd: { increment: row.costMicroUsd } },
    }),
  ]);
  return spend.spentMicroUsd;
}
