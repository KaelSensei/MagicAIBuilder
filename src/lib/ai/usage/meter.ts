/**
 * The AI allowance gate and settlement: reserve before a model call, record
 * what it cost after. The routes use this through `callModelMetered`.
 */
import { logger } from "@/lib/logger";
import type { AiCallDenial } from "./denial";
import {
  claimAllowanceUnit,
  readAllowanceUsed,
  readMonthlySpend,
  releaseAllowanceUnit,
  writeUsage,
} from "./ledger";
import {
  countsAgainstAllowance,
  readAiUsageLimits,
  usagePeriodAt,
  type AiCallOutcome,
  type AiRoute,
  type UsagePeriod,
} from "./policy";
import {
  priceModelUsage,
  PRICE_TABLE_VERSION,
  type TokenUsage,
} from "./prices";

const LOG_CONTEXT = "ai-usage";

/** A unit of allowance reserved for one model call, settled after it. */
export interface AiCallTicket {
  readonly userId: string;
  readonly route: AiRoute;
  /** The month the unit was taken from; settlement returns it there. */
  readonly period: UsagePeriod;
}

/** The answer of the gate: a ticket, or why the call may not be made. */
export type AiCallGate =
  | { readonly ok: true; readonly ticket: AiCallTicket }
  | { readonly ok: false; readonly denial: AiCallDenial };

/** What one finished model call reported, for the ledger. */
export interface AiCallReport {
  readonly provider: string;
  readonly model: string;
  readonly usage: TokenUsage;
  readonly stopReason: string | null;
  readonly outcome: AiCallOutcome;
}

/** No token billed: a request that never reached the model. */
export const NO_TOKENS: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

/**
 * Reserves one call on a route before the model is asked.
 *
 * The global spend ceiling is checked first, so a refusal for the ceiling
 * takes nothing from the user's allowance. The ceiling is read, not reserved:
 * calls already in flight when it is reached may finish, so the month can
 * overshoot by at most their cost.
 *
 * @param userId - the caller
 * @param route - the metered route
 * @param now - the current instant, which picks the month
 * @returns a ticket to settle after the call, or the denial to send
 */
export async function reserveAiCall(
  userId: string,
  route: AiRoute,
  now: Date = new Date()
): Promise<AiCallGate> {
  const period = usagePeriodAt(now);
  const limits = readAiUsageLimits(process.env);

  const spent = await readMonthlySpend(period.start);
  if (spent >= BigInt(limits.monthlySpendCeilingMicroUsd)) {
    return {
      ok: false,
      denial: { code: "ai_spend_ceiling_reached", resetsAt: period.resetsAt },
    };
  }

  const limit = limits.monthlyCalls[route];
  const claimed = await claimAllowanceUnit(userId, route, period.start, limit);
  if (!claimed) {
    return {
      ok: false,
      denial: {
        code: "allowance_exhausted",
        route,
        limit,
        resetsAt: period.resetsAt,
      },
    };
  }
  return { ok: true, ticket: { userId, route, period } };
}

/**
 * Records one finished model call and settles its reserved unit.
 *
 * The call is priced from the provider's `usage`, written to the ledger and
 * added to the month's spend whatever its outcome. A call that failed on our
 * side gives its unit back. A ledger failure is logged, not thrown: the call
 * has already been paid for, and failing the request would waste it.
 *
 * @param ticket - the unit reserved for this call
 * @param report - what the provider reported and how the route used it
 */
export async function settleAiCall(
  ticket: AiCallTicket,
  report: AiCallReport
): Promise<void> {
  const counts = countsAgainstAllowance(report.outcome);
  const priced = priceModelUsage(report.model, report.usage);
  try {
    const spent = await writeUsage(
      {
        userId: ticket.userId,
        route: ticket.route,
        ...report,
        ...priced,
        countsAgainstAllowance: counts,
      },
      ticket.period.start
    );
    alertWhenCeilingCrossed(spent, priced.costMicroUsd, ticket.period);
  } catch (error) {
    logger.error("AI usage could not be recorded", LOG_CONTEXT, error);
  }
  if (counts) return;
  try {
    await releaseAllowanceUnit(
      ticket.userId,
      ticket.route,
      ticket.period.start
    );
  } catch (error) {
    logger.error("AI allowance unit could not be returned", LOG_CONTEXT, error);
  }
}

/**
 * Tells the owner, once a month, that AI has been switched off.
 *
 * Only the call whose cost carried the spend across the ceiling logs, so the
 * alert is not repeated by every later call or every denied request.
 *
 * @param spent - the month's spend after this call
 * @param cost - this call's cost
 * @param period - the month
 */
function alertWhenCeilingCrossed(
  spent: bigint,
  cost: number,
  period: UsagePeriod
): void {
  const ceiling = BigInt(
    readAiUsageLimits(process.env).monthlySpendCeilingMicroUsd
  );
  if (spent >= ceiling && spent - BigInt(cost) < ceiling) {
    logger.error(
      `AI monthly spend ceiling reached: AI calls are off until ${period.resetsAt.toISOString()}`,
      LOG_CONTEXT
    );
  }
}

/**
 * Records a placeholder answer, given when no provider key is configured.
 *
 * It costs nothing and takes nothing from the allowance, but it is recorded so
 * the ledger shows every answer a route gave (I-30 requirement 4.1).
 *
 * @param userId - the caller
 * @param route - the route that answered
 */
export async function recordPlaceholderAnswer(
  userId: string,
  route: AiRoute
): Promise<void> {
  try {
    await writeUsage(
      {
        userId,
        route,
        provider: "placeholder",
        model: "placeholder",
        usage: NO_TOKENS,
        stopReason: null,
        outcome: "ok",
        costMicroUsd: 0,
        priceTableVersion: PRICE_TABLE_VERSION,
        countsAgainstAllowance: false,
      },
      usagePeriodAt(new Date()).start
    );
  } catch (error) {
    logger.error("AI usage could not be recorded", LOG_CONTEXT, error);
  }
}

/** What a user has left on one route this month. */
export interface RouteAllowance {
  readonly limit: number;
  readonly used: number;
  readonly remaining: number;
}

/** A user's AI allowance this month, as the allowance endpoint reports it. */
export interface AiAllowanceSummary {
  readonly periodStart: Date;
  readonly resetsAt: Date;
  /** False once the month's spend reached the global ceiling. */
  readonly aiAvailable: boolean;
  readonly routes: Readonly<Record<AiRoute, RouteAllowance>>;
}

/**
 * Reads what a user has left on every metered route this month.
 *
 * @param userId - the caller
 * @param now - the current instant, which picks the month
 * @returns limits, use and remaining calls per route, and the reset instant
 */
export async function readAiAllowance(
  userId: string,
  now: Date = new Date()
): Promise<AiAllowanceSummary> {
  const period = usagePeriodAt(now);
  const limits = readAiUsageLimits(process.env);
  const [used, spent] = await Promise.all([
    readAllowanceUsed(userId, period.start),
    readMonthlySpend(period.start),
  ]);
  const routeAllowance = (route: AiRoute): RouteAllowance => {
    const limit = limits.monthlyCalls[route];
    return {
      limit,
      used: used[route],
      remaining: Math.max(0, limit - used[route]),
    };
  };
  return {
    periodStart: period.start,
    resetsAt: period.resetsAt,
    aiAvailable: spent < BigInt(limits.monthlySpendCeilingMicroUsd),
    routes: {
      build: routeAllowance("build"),
      suggest: routeAllowance("suggest"),
    },
  };
}
