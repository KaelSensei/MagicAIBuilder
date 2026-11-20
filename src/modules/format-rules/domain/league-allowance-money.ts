/**
 * The money part of a league allowance: what the added cards cost in the
 * league's one market (I-104).
 *
 * Format-rules context, domain layer. Additions are priced; cards that left
 * are not refunded, which is the precon league's "money in upgrades" rule
 * (Commander's Herald, 2024-01-15). An added card with no price on the
 * registration day is `unknown`, never a guessed pass.
 * Not responsible for: reading a price feed (I-32) or carrying a missed week
 * (the caller passes `carriedIn`).
 *
 * @module format-rules/league-allowance-money
 */

import { changedCopies, uniqueNames } from "./league-list-diff";
import type {
  AllowancePart,
  AllowancePartReport,
  AllowanceVerdict,
  DatedCardPrice,
  LeagueListPair,
  PriceMarket,
} from "./league-allowance-types";

type MoneyPart = Extract<AllowancePart, { kind: "money" }>;

interface ResolvedPrice {
  readonly amount: number | null;
  readonly priceDate: string;
  readonly conflict: boolean;
}

interface MoneyFields {
  readonly verdict: AllowanceVerdict;
  readonly detail: string;
  readonly cards: readonly string[];
  readonly carryOut: number | null;
  readonly priceDate: string | null;
}

/**
 * Prices every added copy and compares the sum with this round's budget plus
 * any carried-in amount the host still allows.
 *
 * @param part - the money part, including whether unspent budget carries out
 * @param lists - the previous registered list and the list being checked
 * @param prices - the registration day's prices in every market the caller has
 * @returns pass with the carry-out, fail when the sum is over, or unknown
 */
export function checkMoney(
  part: MoneyPart,
  lists: LeagueListPair,
  prices: readonly DatedCardPrice[]
): AllowancePartReport {
  const spent = spend(
    part,
    changedCopies(lists.previous, lists.next).in,
    priceIndex(prices)
  );
  if (spent.unpriced.length > 0) {
    return moneyReport(part, {
      verdict: "unknown",
      detail: unpricedDetail(spent.unpriced),
      cards: spent.unpriced,
      carryOut: null,
      priceDate: null,
    });
  }
  if (spent.dates.size > 1) {
    return moneyReport(part, {
      verdict: "unknown",
      detail: "price dates disagree",
      cards: [],
      carryOut: null,
      priceDate: null,
    });
  }
  const budget =
    toCents(part.amount) + (part.carryOver ? toCents(part.carriedIn) : 0);
  const priceDate = spent.dates.values().next().value ?? null;
  const detail = `${formatMoney(spent.cents, part.market)} of ${formatMoney(budget, part.market)}`;
  if (spent.cents > budget) {
    return moneyReport(part, {
      verdict: "fail",
      detail,
      cards: [],
      carryOut: null,
      priceDate,
    });
  }
  return moneyReport(part, {
    verdict: "pass",
    detail,
    cards: [],
    carryOut: part.carryOver ? (budget - spent.cents) / 100 : 0,
    priceDate,
  });
}

interface Spend {
  readonly cents: number;
  readonly unpriced: readonly string[];
  readonly dates: ReadonlySet<string>;
}

function spend(
  part: MoneyPart,
  added: readonly { readonly name: string }[],
  index: ReadonlyMap<string, ResolvedPrice>
): Spend {
  const unpriced: string[] = [];
  const dates = new Set<string>();
  let cents = 0;
  for (const line of added) {
    const price = index.get(priceKey(part.market, part.priceSource, line.name));
    if (price === undefined || price.conflict || price.amount === null) {
      unpriced.push(line.name);
      continue;
    }
    cents += toCents(price.amount);
    dates.add(price.priceDate);
  }
  return { cents, unpriced: uniqueNames(unpriced), dates };
}

function moneyReport(
  part: MoneyPart,
  fields: MoneyFields
): AllowancePartReport {
  return {
    part: "money",
    verdict: fields.verdict,
    detail: fields.detail,
    cards: fields.cards,
    carryOut: fields.carryOut,
    priceDate: fields.priceDate,
    priceSource: part.priceSource,
  };
}

function priceIndex(
  prices: readonly DatedCardPrice[]
): Map<string, ResolvedPrice> {
  const index = new Map<string, ResolvedPrice>();
  for (const price of prices) {
    const key = priceKey(price.market, price.source, price.name);
    const existing = index.get(key);
    index.set(
      key,
      existing === undefined
        ? { amount: price.amount, priceDate: price.priceDate, conflict: false }
        : {
            amount: existing.amount,
            priceDate: existing.priceDate,
            conflict:
              existing.conflict ||
              existing.amount !== price.amount ||
              existing.priceDate !== price.priceDate,
          }
    );
  }
  return index;
}

function priceKey(market: PriceMarket, source: string, name: string): string {
  return `${market}\u0000${source}\u0000${name}`;
}

/** Currency units to integer cents, so 13.50 and 0.1 do not drift. */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function formatMoney(cents: number, market: PriceMarket): string {
  const sign = market === "usd" ? "$" : "€";
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = (absolute % 100).toString().padStart(2, "0");
  const text = `${sign}${whole}.${fraction}`;
  return negative ? `-${text}` : text;
}

function unpricedDetail(names: readonly string[]): string {
  const verb = names.length === 1 ? "is" : "are";
  return `${names.join(", ")} ${verb} unpriced`;
}
