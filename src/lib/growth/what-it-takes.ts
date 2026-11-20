/**
 * What it takes: the active accounts and the sign-ups a month that a number of payers needs
 * (I-72 requirement 9.1, slice 5).
 *
 * Growth targets, pure. I-66 finds how many payers cover the running costs and how many make a
 * living (I-66 9.1). This module turns that count into the volume the growth loops must bring:
 * active accounts are payers ÷ conversion (I-30 assumption A7), and the sign-ups a month that hold
 * the active base steady are active × churn ÷ activation. Every rate is an assumption until I-39
 * measures it; the owner view of slice 6 passes measured rates instead.
 *
 * Not responsible for: the payer count (I-66), measuring the rates (I-39), or how a measured rate
 * with a small denominator is shown (I-39 11.9, slice 6).
 *
 * @module growth/what-it-takes
 */

/** The goal and the rates a target is computed from. Each rate is a share, such as 0.03 for 3%. */
export interface GrowthTargetInput {
  /** Paying accounts the goal needs, from I-66 9.1 */
  readonly payers: number;
  /** Share of 30-day active accounts that pay (I-30 assumption A7: 3%) */
  readonly conversion: number;
  /** Share of sign-ups active within 7 days (I-39's example baseline: 30%) */
  readonly activation: number;
  /** Monthly share of active accounts that stop (assumed 10%, with 5% and 20% in brackets) */
  readonly churn: number;
}

/** What a goal takes, rounded to whole accounts. */
export interface GrowthTarget {
  /** 30-day active accounts that yield the payers at the conversion rate */
  readonly activeAccounts: number;
  /** Sign-ups a month that replace the active accounts churn removes */
  readonly signUpsPerMonth: number;
}

/**
 * The active accounts and the monthly sign-ups a number of payers needs.
 *
 * Both figures are rounded once, at the end, so a sign-up count is computed from the unrounded
 * active base: 22 payers at 3% are 733.3 active accounts, and 244 sign-ups a month at a 10% churn
 * and a 30% activation.
 *
 * @param input - the payers and the conversion, activation and churn rates
 * @returns the active accounts and the sign-ups a month, as whole numbers
 * @throws RangeError when the conversion or the activation is not above zero: no volume then
 * meets the goal, and the division would return `Infinity` or `NaN`
 */
export function whatItTakes(input: GrowthTargetInput): GrowthTarget {
  requireAboveZero("Conversion", input.conversion);
  requireAboveZero("Activation", input.activation);
  const activeAccounts = input.payers / input.conversion;
  return {
    activeAccounts: Math.round(activeAccounts),
    signUpsPerMonth: Math.round((activeAccounts * input.churn) / input.activation),
  };
}

/** A rate the target divides by: zero, negative or `NaN` is refused. */
function requireAboveZero(rate: string, value: number): void {
  if (Number.isNaN(value) || value <= 0) {
    throw new RangeError(`${rate} must be above zero, got ${value}`);
  }
}
