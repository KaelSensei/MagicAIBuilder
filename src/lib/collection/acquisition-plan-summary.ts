/**
 * Totals of an acquisition plan, as the collection page's panel shows them.
 *
 * Pure. Only the copies to buy now count toward the missing count, the unpriced
 * count and the price total, as in a deck's shopping list: a copy the player chose
 * to proxy or buy later is reported apart, never in the total or the CSV.
 *
 * @module collection/acquisition-plan-summary
 */

/** The fields of a plan line the totals read. */
export interface AcquisitionPlanLine {
  readonly acquireQuantity: number;
  readonly deferredQuantity: number;
  readonly price: number | null;
}

/** A plan split into what is bought now and what is deferred, with the buy-now totals. */
export interface AcquisitionPlanSummary<Line extends AcquisitionPlanLine> {
  /** Lines with at least one copy to buy now. */
  readonly buyNow: readonly Line[];
  /** Lines with at least one copy a deck chose to proxy or buy later. */
  readonly deferred: readonly Line[];
  /** Copies to buy now. */
  readonly missingCount: number;
  /** Copies to buy now whose printing has no price. */
  readonly unpricedCount: number;
  /** Known price of the copies to buy now, in USD. */
  readonly knownCost: number;
  /** Copies deferred, across every line. */
  readonly deferredCount: number;
}

/**
 * Splits plan lines into buy-now and deferred, and sums the buy-now copies and prices.
 *
 * A line can be in both lists when some of its copies are bought and others deferred.
 *
 * @param items - the plan's lines, in the plan's order
 * @returns both lists, in that order, and the totals
 */
export function summarizeAcquisitionPlan<Line extends AcquisitionPlanLine>(
  items: readonly Line[]
): AcquisitionPlanSummary<Line> {
  const buyNow: Line[] = [];
  const deferred: Line[] = [];
  let missingCount = 0;
  let unpricedCount = 0;
  let knownCost = 0;
  let deferredCount = 0;
  for (const item of items) {
    if (item.acquireQuantity > 0) buyNow.push(item);
    if (item.deferredQuantity > 0) deferred.push(item);
    missingCount += item.acquireQuantity;
    deferredCount += item.deferredQuantity;
    if (item.price === null) unpricedCount += item.acquireQuantity;
    else knownCost += item.price * item.acquireQuantity;
  }
  return {
    buyNow,
    deferred,
    missingCount,
    unpricedCount,
    knownCost,
    deferredCount,
  };
}
