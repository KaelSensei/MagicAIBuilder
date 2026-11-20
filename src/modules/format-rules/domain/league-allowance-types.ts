/**
 * The cards, prices and verdicts a league allowance check reports (I-104).
 *
 * Format-rules context, domain layer. Types only: the check that reads them
 * is `league-allowance.ts`. A verdict is a report (ADR 0009), so `unknown`
 * is its own outcome and never a silent pass.
 *
 * @module format-rules/league-allowance-types
 */

/** One printing-agnostic card in a registered list, with a copy count. */
export interface LeagueListCard {
  /** Oracle name. Matching is exact, including apostrophes. */
  readonly name: string;
  /** Copies in the list. Zero and negative counts are ignored. */
  readonly count: number;
  /** A basic land. Omitted means this card is not basic. */
  readonly basic?: boolean;
  /**
   * In the command zone. Omitted means it is in the deck. A commander change
   * counts as a swap only when the swaps part says `commanderCounts`.
   */
  readonly commander?: boolean;
}

/** The two lists a round compares. One argument, so the check stays at three. */
export interface LeagueListPair {
  /** The member's previous registered list, or the starting list in round 1. */
  readonly previous: readonly LeagueListCard[];
  /** The list being checked for this round. */
  readonly next: readonly LeagueListCard[];
}

/** The market a league prices in. There is no conversion between the two. */
export type PriceMarket = "usd" | "eur";

/**
 * One part of a round's allowance. An unknown kind is not representable: the
 * check's switch ends on `never`.
 */
export type AllowancePart =
  | {
      readonly kind: "swaps";
      /** Counted swaps allowed this round. */
      readonly max: number;
      /** Basic-for-basic land swaps do not count when this is true. */
      readonly basicsExempt: boolean;
      /** A commander leaving or arriving counts when this is true. */
      readonly commanderCounts: boolean;
    }
  | {
      readonly kind: "money";
      /** This round's budget, in `market` units. */
      readonly amount: number;
      readonly market: PriceMarket;
      /** The only source a price may come from. */
      readonly priceSource: string;
      /** Unspent budget carries to the next round when this is true. */
      readonly carryOver: boolean;
      /**
       * Unspent budget from earlier rounds, already resolved by the caller.
       * Ignored when `carryOver` is false, so a lost week adds nothing.
       */
      readonly carriedIn: number;
    }
  | {
      readonly kind: "pool";
      /** Added cards must be named in `declared` when this is true. */
      readonly declaredOnly: boolean;
      /** Card names the member declared as opened this round. */
      readonly declared: readonly string[];
    };

/**
 * A price for one card in one market from one source. `amount` is null when
 * that source has no price on `priceDate`.
 */
export interface DatedCardPrice {
  readonly name: string;
  readonly market: PriceMarket;
  readonly source: string;
  /** ISO date the price was read, `YYYY-MM-DD`. */
  readonly priceDate: string;
  readonly amount: number | null;
}

/** A part's verdict. `unknown` is not a pass: an unpriced card stays unresolved. */
export type AllowanceVerdict = "pass" | "fail" | "unknown";

/** One card out paired with one card in. A side is null when the counts differ. */
export interface SwapPair {
  readonly out: string | null;
  readonly in: string | null;
  /** True when a basic-for-basic swap was set aside and not counted. */
  readonly exempt: boolean;
}

/** The report for one allowance part. `part` says which of the other fields apply. */
export type AllowancePartReport =
  | {
      readonly part: "swaps";
      readonly verdict: AllowanceVerdict;
      readonly detail: string;
      readonly pairs: readonly SwapPair[];
    }
  | {
      readonly part: "money";
      readonly verdict: AllowanceVerdict;
      readonly detail: string;
      /** Added cards with no usable price, when the verdict is `unknown`. */
      readonly cards: readonly string[];
      /** Unspent budget to carry, or null when the part did not pass. */
      readonly carryOut: number | null;
      /** The date of the prices used, or null when none were read. */
      readonly priceDate: string | null;
      readonly priceSource: string;
    }
  | {
      readonly part: "pool";
      readonly verdict: AllowanceVerdict;
      readonly detail: string;
      /** Added cards outside the declared pool, when the verdict is `fail`. */
      readonly cards: readonly string[];
    };

/** Every part's report, in the allowance's order. `passed` is true only when all passed. */
export interface AllowanceReport {
  readonly parts: readonly AllowancePartReport[];
  readonly passed: boolean;
}
