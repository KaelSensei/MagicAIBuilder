/**
 * The deck size rule: how many cards a deck must hold, and whether a count is
 * short of it, within it or over it.
 *
 * Format-rules context, domain layer: a pure rule shared by the server and the
 * browser, which reports and never refuses (ADR 0009). Its readers are the
 * editor counter, the deck list, the builder header, the deck checks panel and
 * the AI deck check.
 * Rules: a format bounds its deck size in one of two ways.
 * - Exact: CR 903.5a, a Commander deck holds exactly 100 cards, the commander
 *   included ("the minimum deck size and the maximum deck size are both
 *   100"); CR 903.12d says the same of Brawl's 60.
 * - Minimum: CR 100.2a, a constructed deck "has a minimum deck size of 60
 *   cards", and the rules set no maximum.
 * CR 903.5e: a rulebreaker commander may lift an exact format's maximum
 * (Whtz, the Bibliophile); the minimum stays. CR 113.6n: that never changes a
 * card's legality.
 * Not responsible for: which size and bound a format has (`FormatConfig`,
 * given by the caller) or how a screen words the count.
 *
 * @module format-rules/deck-size
 */
import {
  liftsMaximumDeckSize,
  type RulebreakerException,
} from "@/modules/format-rules/domain/rulebreakers";

/**
 * How a format bounds its deck size: `exact` holds the deck to its size, as
 * Commander's 100 (CR 903.5a); `minimum` takes that many cards or more, as a
 * constructed format's 60 (CR 100.2a).
 */
export type DeckSizeBound = "exact" | "minimum";

/** The deck size a format sets: a card count and how it bounds the deck. */
export interface FormatDeckSize {
  /** The size, a positive integer */
  readonly cards: number;
  readonly bound: DeckSizeBound;
}

/**
 * The cards a deck may hold: at least `minimum`, at most `maximum`, or with no
 * maximum when `maximum` is null (a minimum-bound format, CR 100.2a; or a
 * rulebreaker commander, CR 903.5e).
 */
export interface DeckSizeRule {
  readonly minimum: number;
  readonly maximum: number | null;
  /**
   * The format's own bound, before any rulebreaker: it tells a counter to show
   * "63/60+" for a constructed deck, and a Whtz deck's bare count.
   */
  readonly formatBound: DeckSizeBound;
}

/** Where a card count stands against a {@link DeckSizeRule}. */
export type DeckSizeStatus = "short" | "legal" | "over";

/**
 * The size rule of a deck whose format sets `formatSize`: exactly that many
 * cards for an exact bound (CR 903.5a), or at least that many for a minimum
 * bound (CR 100.2a) or when a rulebreaker commander lifts the maximum
 * (CR 903.5e).
 *
 * @param formatSize - The size and bound the caller holds the deck to
 * @param exceptions - The command zone's rulebreaker exceptions
 *   (`deckConstructionExceptions`); empty for any other commander
 * @returns The minimum `formatSize.cards`, and the maximum `formatSize.cards`
 *   or none
 */
export function deckSizeRule(
  formatSize: FormatDeckSize,
  exceptions: readonly RulebreakerException[]
): DeckSizeRule {
  const hasMaximum =
    formatSize.bound === "exact" && !liftsMaximumDeckSize(exceptions);
  return {
    minimum: formatSize.cards,
    maximum: hasMaximum ? formatSize.cards : null,
    formatBound: formatSize.bound,
  };
}

/**
 * Where `cardCount` stands against `rule`.
 *
 * @param cardCount - The cards the deck holds, its command zone included
 * @param rule - The deck's size rule
 * @returns `short` under the minimum, `over` above a maximum, `legal` otherwise
 */
export function deckSizeStatus(
  cardCount: number,
  rule: DeckSizeRule
): DeckSizeStatus {
  if (cardCount < rule.minimum) return "short";
  if (rule.maximum !== null && cardCount > rule.maximum) return "over";
  return "legal";
}
