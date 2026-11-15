/**
 * Frank Karsten's published Commander mana-base numbers, as data and pure
 * functions: the 99-card land-count formula, the coloured-source column, the
 * weights of partial sources and modal double-faced lands, and his rule of
 * thumb.
 *
 * Deck analysis, I-58 slice 1. Later slices read these tables: the mana base
 * check, the wizard's basic split and the land proposal.
 * Sources, read through TCGplayer's content API on 2026-11-10:
 * - [1] "What's an Optimal Mana Curve and Land/Ramp Count for Commander?",
 *   2022-07-15. https://www.tcgplayer.com/content/article/What-s-an-Optimal-Mana-Curve-and-Land-Ramp-Count-for-Commander/e22caad1-b04b-4f8a-951b-a41e9f08da14/
 * - [2] "How Many Lands Do You Need in Your Deck? An Updated Analysis",
 *   2022-07-29, updated 2025-02-13. https://www.tcgplayer.com/content/article/How-Many-Lands-Do-You-Need-in-Your-Deck-An-Updated-Analysis/cd1c1a24-d439-4a8e-b369-b936edb0b38a/
 * - [3] "How Many Sources Do You Need to Consistently Cast Your Spells? A 2022
 *   Update", 2022-08-02, updated 2025-02-13. https://www.tcgplayer.com/content/article/How-Many-Sources-Do-You-Need-to-Consistently-Cast-Your-Spells-A-2022-Update/dc23a7d2-0a16-4c0b-ad36-586fcca03ad8/
 * Not responsible for: reading a deck (its average mana value, its cheap ramp
 * and draw, its drivers), classifying lands, or the proportional advice in
 * `mana-alignment.ts`. No AI client is reachable from here.
 *
 * @module deck/mana-base-tables
 */

/** Karsten's 99-card land-count formula [2]: 31.42 + 3.13 × a − 0.28 × c. */
const LAND_FORMULA = {
  intercept: 31.42,
  perAverageManaValue: 3.13,
  perCheapRampOrDraw: -0.28,
} as const;

/** The deck figures the land-count formula reads. */
export interface LandCountInputs {
  /** Average mana value of the 99's nonland cards, commander excluded */
  readonly averageManaValue: number;
  /**
   * Cards of mana value 2 or less that draw cards, add mana or search for
   * lands: Karsten's "cheap card draw or mana ramp" [2]
   */
  readonly cheapRampAndDraw: number;
}

/**
 * Why the formula has no answer, so a screen can say what is missing instead
 * of showing a number:
 * - `not-a-mana-value`: the average is negative or not a finite number.
 * - `not-a-card-count`: the cheap-piece count is negative or not whole.
 */
export type LandCountGap = "not-a-mana-value" | "not-a-card-count";

/** The formula's land count, or the reason there is none. */
export type LandCountTarget =
  | {
      readonly kind: "known";
      /** Lands, to two decimals, as Karsten's coefficients are published */
      readonly lands: number;
    }
  | { readonly kind: "unknown"; readonly reason: LandCountGap };

/**
 * Whether a value can be a number of cards: whole and not negative.
 *
 * @param count - the value to check
 */
function isCardCount(count: number): boolean {
  return Number.isInteger(count) && count >= 0;
}

/**
 * Rounds to two decimals, the precision of the published coefficients, so
 * 40.81 never reads as 40.809999999999995.
 *
 * @param value - the raw formula result
 */
function toHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Karsten's recommended land count for a 99-card Commander deck [2].
 *
 * The formula was fitted on 95,143 winning 60-card decks and scaled to 99
 * cards; its author calls it "an imprecise back-of-the-envelope estimate", so
 * a screen shows it as a labelled reference, never as the only answer.
 *
 * @example
 * landCountTarget({ averageManaValue: 3, cheapRampAndDraw: 10 });
 * // → { kind: "known", lands: 38.01 }
 *
 * @param inputs - the average mana value and the cheap ramp and draw count
 * @returns the land count, or `unknown` with the input that cannot be used
 */
export function landCountTarget(inputs: LandCountInputs): LandCountTarget {
  const { averageManaValue, cheapRampAndDraw } = inputs;
  if (!Number.isFinite(averageManaValue) || averageManaValue < 0) {
    return { kind: "unknown", reason: "not-a-mana-value" };
  }
  if (!isCardCount(cheapRampAndDraw)) {
    return { kind: "unknown", reason: "not-a-card-count" };
  }
  const lands =
    LAND_FORMULA.intercept +
    LAND_FORMULA.perAverageManaValue * averageManaValue +
    LAND_FORMULA.perCheapRampOrDraw * cheapRampAndDraw;
  return { kind: "known", lands: toHundredths(lands) };
}
