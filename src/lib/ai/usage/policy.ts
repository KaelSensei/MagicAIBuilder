/**
 * The monthly AI allowance as pure policy: which routes are metered, which
 * outcomes consume a call, where a month starts, and the limits read from the
 * environment. The database side lives in `ledger.ts`.
 */

/** An API route that sends a prompt to a model on a user's behalf. */
export type AiRoute = "build" | "suggest" | "translate";

/** Every metered route, in a stable order. */
export const AI_ROUTES: readonly AiRoute[] = ["build", "suggest", "translate"];

/**
 * How one model call ended (I-30 requirement 4.2).
 *
 * - `ok`: the reply was complete and the route used it.
 * - `truncated`: the provider stopped at the output-token cap.
 * - `refused`: the provider declined to answer.
 * - `parseFailed`: the reply was complete but not the JSON the route asked for.
 * - `rejectedByValidator`: the reply parsed but failed the route's checks.
 * - `providerError`: the request failed, timed out or returned an HTTP error.
 */
export type AiCallOutcome =
  | "ok"
  | "truncated"
  | "refused"
  | "parseFailed"
  | "rejectedByValidator"
  | "providerError";

/**
 * Whether a call that ended this way uses up one unit of the user's allowance.
 *
 * A call that failed on our side (cut off, unparsable, rejected by our
 * validator, or lost at the provider) gives its unit back: the user did not
 * get an answer (I-30 requirement 4.4). Its cost is still recorded. A refusal
 * is an answer and counts.
 *
 * @param outcome - how the call ended
 * @returns true when the reserved unit stays consumed
 */
export function countsAgainstAllowance(outcome: AiCallOutcome): boolean {
  switch (outcome) {
    case "ok":
    case "refused":
      return true;
    case "truncated":
    case "parseFailed":
    case "rejectedByValidator":
    case "providerError":
      return false;
    default: {
      const unreachable: never = outcome;
      return unreachable;
    }
  }
}

/** One allowance period: a calendar month in UTC. */
export interface UsagePeriod {
  /** First instant of the month, UTC. */
  readonly start: Date;
  /** First instant of the next month, UTC, when the allowance resets. */
  readonly resetsAt: Date;
}

/**
 * The UTC calendar month an instant falls in.
 *
 * UTC so that every instance, whatever its time zone, counts into the same
 * row, and a user's reset date does not depend on which server answered.
 *
 * @param now - the instant to place
 * @returns the month's first instant and the next month's first instant
 */
export function usagePeriodAt(now: Date): UsagePeriod {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1)),
    resetsAt: new Date(Date.UTC(year, month + 1, 1)),
  };
}

/** Monthly limits on model use. */
export interface AiUsageLimits {
  /** Calls each user may make on each route in one UTC month. */
  readonly monthlyCalls: Readonly<Record<AiRoute, number>>;
  /** What all users together may spend in one UTC month, in micro-dollars. */
  readonly monthlySpendCeilingMicroUsd: number;
}

/**
 * Conservative defaults, each an owner decision.
 *
 * The allowances are I-30's free-plan hypothesis (requirement 4.3). Search
 * translation is one short completion, so its allowance is higher than a
 * suggestion. The ceiling is not in the spec: 20 USD covers about 45 users
 * using their whole allowance on today's Haiku 4.5, at I-02's estimate of
 * 0.008 USD a build and 0.012 USD a suggestion call.
 */
export const DEFAULT_AI_USAGE_LIMITS: AiUsageLimits = {
  monthlyCalls: { build: 10, suggest: 30, translate: 60 },
  monthlySpendCeilingMicroUsd: 20_000_000,
};

/** The environment variable that overrides each route's monthly allowance. */
const ALLOWANCE_ENV: Readonly<Record<AiRoute, string>> = {
  build: "AI_MONTHLY_BUILD_ALLOWANCE",
  suggest: "AI_MONTHLY_SUGGEST_ALLOWANCE",
  translate: "AI_MONTHLY_TRANSLATE_ALLOWANCE",
};

const SPEND_CEILING_ENV = "AI_MONTHLY_SPEND_CEILING_USD";

const WHOLE_NUMBER = /^\d+$/;
const DECIMAL_NUMBER = /^\d+(\.\d+)?$/;

/**
 * Reads a non-negative whole number, or keeps the default.
 *
 * @param raw - the variable's value, if set
 * @param fallback - the value to keep when `raw` is absent or malformed
 * @returns the parsed number or the fallback
 */
function readWholeNumber(raw: string | undefined, fallback: number): number {
  return raw !== undefined && WHOLE_NUMBER.test(raw) ? Number(raw) : fallback;
}

/**
 * Reads the monthly limits from the environment.
 *
 * A missing or malformed value keeps its default rather than failing the
 * request: every default is a limit, so a typo cannot lift one.
 *
 * @param env - the process environment, or a test double
 * @returns the allowances per route and the global spend ceiling
 */
export function readAiUsageLimits(
  env: Readonly<Record<string, string | undefined>>
): AiUsageLimits {
  const ceilingUsd = env[SPEND_CEILING_ENV];
  return {
    monthlyCalls: {
      build: readWholeNumber(
        env[ALLOWANCE_ENV.build],
        DEFAULT_AI_USAGE_LIMITS.monthlyCalls.build
      ),
      suggest: readWholeNumber(
        env[ALLOWANCE_ENV.suggest],
        DEFAULT_AI_USAGE_LIMITS.monthlyCalls.suggest
      ),
      translate: readWholeNumber(
        env[ALLOWANCE_ENV.translate],
        DEFAULT_AI_USAGE_LIMITS.monthlyCalls.translate
      ),
    },
    monthlySpendCeilingMicroUsd:
      ceilingUsd !== undefined && DECIMAL_NUMBER.test(ceilingUsd)
        ? Math.round(Number(ceilingUsd) * 1_000_000)
        : DEFAULT_AI_USAGE_LIMITS.monthlySpendCeilingMicroUsd,
  };
}
