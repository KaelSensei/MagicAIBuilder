/**
 * The running cost of one active player, and the usage at which each free allotment runs out
 * (I-66 requirements 3.3 and 4.1, slice 1).
 *
 * Pure. Takes a month of usage from `player-usage` and entries from `price-book`, so a measured
 * month (slice 2) and an assumed one go through the same arithmetic. Every figure is computed, in
 * the sense of I-66 1.3: its inputs are dated prices and labelled assumptions.
 *
 * Not responsible for: choosing the plan or region (the caller passes those entries), the fixed
 * floor and break-even (I-66 5.1 and 9.1), AI cost (I-30), or rounding for display.
 *
 * @module costs/cost-model
 */
import type { ResourceUsage } from "./player-usage";
import type { CostPrice, MeteredResource } from "./price-book";

/** One active player's monthly cost on a usage-based plan, in US dollars. */
export interface PlayerCost {
  /** The resources the plan bills from the first unit: functions and origin transfer on Vercel Pro */
  readonly usageBasedUsd: number;
  /** Every priced resource billed from the first unit, as if the plan's inclusions were spent */
  readonly allResourcesUsd: number;
}

/** What a stock of a resource is divided among: the players using it, or the accounts storing data. */
export type LimitAudience = "active players" | "stored accounts";

/** Where one allotment runs out. */
export interface LimitHeadroom {
  readonly allotment: CostPrice;
  /** One player's or one account's monthly use of the resource */
  readonly perPlayer: number;
  readonly scalesWith: LimitAudience;
  /** The players or accounts at which the allotment is spent; `null` when none use it */
  readonly hitsAt: number | null;
}

/**
 * One active player's monthly cost under one plan's rates (I-66 3.3).
 *
 * @param usage - a month of one active player's usage
 * @param rates - the rates of one plan in one region; allotments without a rate are skipped
 * @returns the cost of the usage-based resources, and of every priced resource
 * @throws RangeError when two rates name the same resource, which would bill it twice
 */
export function costPerActivePlayer(
  usage: ResourceUsage,
  rates: readonly CostPrice[]
): PlayerCost {
  const billed = new Set<MeteredResource>();
  let usageBasedUsd = 0;
  let allResourcesUsd = 0;
  for (const rate of rates) {
    if (rate.rateUsd === null) continue;
    if (billed.has(rate.resource)) {
      throw new RangeError(
        `Two rates for ${rate.resource}: pass one plan in one region`
      );
    }
    billed.add(rate.resource);
    const cost = usage[rate.resource] * rate.rateUsd;
    allResourcesUsd += cost;
    if (rate.includedQuantity === null) usageBasedUsd += cost;
  }
  return { usageBasedUsd, allResourcesUsd };
}

/**
 * The whole number of active players a usage credit pays for, such as Pro's $20 (I-66 3.3).
 *
 * @param creditUsd - the credit, in US dollars
 * @param costPerPlayerUsd - one active player's monthly cost, from `costPerActivePlayer`
 * @returns the players covered, rounded down
 * @throws RangeError when the cost is not above zero: the credit then never runs out
 */
export function playersCoveredBy(
  creditUsd: number,
  costPerPlayerUsd: number
): number {
  if (Number.isNaN(costPerPlayerUsd) || costPerPlayerUsd <= 0) {
    throw new RangeError(
      `A player's cost must be above zero, got ${costPerPlayerUsd}`
    );
  }
  return Math.floor(creditUsd / costPerPlayerUsd);
}

/**
 * Where each fixed allotment runs out, least headroom first (I-66 4.1 and 4.3).
 *
 * Only allotments a plan cannot extend count: an entry with a rate is a price, not a limit. The
 * database allotment is shared with caches and other tables, so `reservedDatabaseMb` is taken off
 * it first: 100 MB today, 200 MB once I-67's card tables land.
 *
 * @param usage - a month of one active player's usage
 * @param allotments - price-book entries; those with a rate or no included quantity are skipped
 * @param reservedDatabaseMb - database space not available to player data
 * @returns one row per allotment, by ascending `hitsAt`, the ones never hit last
 */
export function limitHeadroom(
  usage: ResourceUsage,
  allotments: readonly CostPrice[],
  reservedDatabaseMb: number
): readonly LimitHeadroom[] {
  const rows: LimitHeadroom[] = [];
  for (const allotment of allotments) {
    if (allotment.rateUsd !== null || allotment.includedQuantity === null)
      continue;
    const isDatabase = allotment.resource === "database-size-mb";
    const available =
      allotment.includedQuantity - (isDatabase ? reservedDatabaseMb : 0);
    const perPlayer = usage[allotment.resource];
    rows.push({
      allotment,
      perPlayer,
      scalesWith: isDatabase ? "stored accounts" : "active players",
      hitsAt: perPlayer > 0 ? available / perPlayer : null,
    });
  }
  return rows.sort(byHeadroom);
}

/** Ascending headroom; an allotment nobody uses sorts after every other. */
function byHeadroom(a: LimitHeadroom, b: LimitHeadroom): number {
  return (
    (a.hitsAt ?? Number.POSITIVE_INFINITY) -
    (b.hitsAt ?? Number.POSITIVE_INFINITY)
  );
}
