/**
 * The price book: every provider price and plan allotment the running-cost model reads
 * (I-66 requirement 2, slice 1).
 *
 * Committed data, not a table. Each entry is one provider's price for one metered resource on one
 * plan, with the date it was read and the page it was read on. A changed price is a new dated
 * entry and the old one stays, so a past month is recomputed with the prices of that month (2.2).
 *
 * Units are decimal: 1 GB is 1,000 MB, as the providers bill and as I-66's tables compute.
 *
 * Not responsible for: AI prices (I-30's table), payment fees (I-30), flagging a price older than
 * 180 days (the monthly report, slice 8).
 *
 * @module costs/price-book
 */

/** A resource a provider meters, named with the unit its quantity is counted in. */
export type MeteredResource =
  | "function-invocations"
  | "active-cpu-hours"
  | "provisioned-memory-gb-hours"
  | "fast-origin-transfer-gb"
  | "fast-data-transfer-gb"
  | "cdn-requests"
  | "speed-insights-events"
  | "session-replays"
  | "database-size-mb"
  | "database-egress-gb";

/** A provider whose plan the product runs on. */
export type CostProvider = "vercel" | "supabase" | "sentry";

/** A plan name as the provider's pricing page writes it, lower-cased. */
export type CostPlan = "hobby" | "pro" | "free" | "developer";

/** One dated price or allotment, read from a provider's page. */
export interface CostPrice {
  readonly provider: CostProvider;
  readonly plan: CostPlan;
  readonly resource: MeteredResource;
  /** US dollars for one unit of the resource; `null` when the plan cannot buy more than it includes */
  readonly rateUsd: number | null;
  /** Units included each month; `null` when every unit is billed */
  readonly includedQuantity: number | null;
  /** The function region the rate applies to, such as `dub1`; `null` when the price has no region */
  readonly region: string | null;
  readonly sourceUrl: string;
  /** The day the price was read, as `YYYY-MM-DD` */
  readonly readOn: string;
}

/**
 * The prices in force on a day: for each provider, plan, resource and region, the entry read last
 * on or before that day (I-66 2.2). A month is priced with the prices in force on its last day.
 *
 * Dates compare as `YYYY-MM-DD` strings, which sort as the days they name.
 *
 * @param book - every dated entry, in any order
 * @param day - the day to price, as `YYYY-MM-DD`
 * @returns one entry per key; none for a key first read after `day`
 */
export function pricesInForce(
  book: readonly CostPrice[],
  day: string
): readonly CostPrice[] {
  const latest = new Map<string, CostPrice>();
  for (const entry of book) {
    if (entry.readOn > day) continue;
    const key = [
      entry.provider,
      entry.plan,
      entry.resource,
      entry.region ?? "",
    ].join("|");
    const held = latest.get(key);
    if (held === undefined || entry.readOn > held.readOn)
      latest.set(key, entry);
  }
  return [...latest.values()];
}

const READ_ON = "2026-11-10";
const VERCEL_PRICING = "https://vercel.com/pricing";
const VERCEL_DUBLIN = "https://vercel.com/docs/pricing/regional-pricing/dub1";
const SPEED_INSIGHTS =
  "https://vercel.com/docs/speed-insights/limits-and-pricing";
const SUPABASE_PRICING = "https://supabase.com/pricing";
const SENTRY_PRICING = "https://sentry.io/pricing/";

/** An allotment a plan includes and cannot extend: it has no rate. */
function allotment(
  key: Pick<CostPrice, "provider" | "plan" | "resource" | "sourceUrl">,
  includedQuantity: number
): CostPrice {
  return {
    ...key,
    rateUsd: null,
    includedQuantity,
    region: null,
    readOn: READ_ON,
  };
}

/** A Vercel Pro rate in Dublin (`dub1`), with the quantity Pro includes, if any. */
function proDublinRate(
  resource: MeteredResource,
  rateUsd: number,
  includedQuantity: number | null
): CostPrice {
  return {
    provider: "vercel",
    plan: "pro",
    resource,
    rateUsd,
    includedQuantity,
    region: "dub1",
    sourceUrl: VERCEL_DUBLIN,
    readOn: READ_ON,
  };
}

type PlanSource = Pick<CostPrice, "provider" | "plan" | "sourceUrl">;
const HOBBY: PlanSource = {
  provider: "vercel",
  plan: "hobby",
  sourceUrl: VERCEL_PRICING,
};
const SUPABASE_FREE: PlanSource = {
  provider: "supabase",
  plan: "free",
  sourceUrl: SUPABASE_PRICING,
};

/**
 * The book as read on 2026-11-10 for I-66 ("What the market does"). Hobby, Supabase Free and
 * Sentry Developer are allotments; Pro rates are Dublin's, next to the database in Ireland.
 */
export const PRICE_BOOK: readonly CostPrice[] = [
  allotment({ ...HOBBY, resource: "function-invocations" }, 1_000_000),
  allotment({ ...HOBBY, resource: "active-cpu-hours" }, 4),
  allotment({ ...HOBBY, resource: "provisioned-memory-gb-hours" }, 360),
  allotment({ ...HOBBY, resource: "fast-origin-transfer-gb" }, 10),
  allotment({ ...HOBBY, resource: "fast-data-transfer-gb" }, 100),
  allotment({ ...HOBBY, resource: "cdn-requests" }, 1_000_000),
  allotment(
    { ...HOBBY, resource: "speed-insights-events", sourceUrl: SPEED_INSIGHTS },
    10_000
  ),
  proDublinRate("function-invocations", 0.6 / 1_000_000, null),
  proDublinRate("active-cpu-hours", 0.168, null),
  proDublinRate("provisioned-memory-gb-hours", 0.0139, null),
  proDublinRate("fast-origin-transfer-gb", 0.06, null),
  proDublinRate("fast-data-transfer-gb", 0.15, 1_000),
  proDublinRate("cdn-requests", 2.4 / 1_000_000, 10_000_000),
  allotment({ ...SUPABASE_FREE, resource: "database-size-mb" }, 500),
  allotment({ ...SUPABASE_FREE, resource: "database-egress-gb" }, 5),
  allotment(
    {
      provider: "sentry",
      plan: "developer",
      resource: "session-replays",
      sourceUrl: SENTRY_PRICING,
    },
    50
  ),
];
