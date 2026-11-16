/**
 * The deck size rule: how many cards a deck must hold, and whether a count is
 * short of it, within it or over it.
 *
 * Format-rules context, domain layer: a pure rule shared by the server and the
 * browser, which reports and never refuses (ADR 0009). Its readers are the
 * editor counter, the deck list, the builder header, the deck checks panel and
 * the AI deck check.
 * Rules: CR 903.5a, a Commander deck holds exactly 100 cards, the commander
 * included. The size a caller gives is held as exact, as every reader did
 * before this rule was shared; the "at least 60" of a constructed deck
 * (CR 100.2a) is not modelled. CR 903.5e: a rulebreaker commander may lift
 * the maximum (Whtz, the Bibliophile); the minimum stays. CR 113.6n: that
 * never changes a card's legality.
 * Not responsible for: which size a format has (`FormatConfig.deckSize`, given
 * by the caller) or how a screen words the count.
 *
 * @module format-rules/deck-size
 */
import {
  liftsMaximumDeckSize,
  type RulebreakerException,
} from "@/modules/format-rules/domain/rulebreakers";

/**
 * The cards a deck may hold: at least `minimum`, at most `maximum`, or with no
 * maximum when `maximum` is null (CR 903.5e; Whtz, the Bibliophile).
 */
export interface DeckSizeRule {
  readonly minimum: number;
  readonly maximum: number | null;
}

/** Where a card count stands against a {@link DeckSizeRule}. */
export type DeckSizeStatus = "short" | "legal" | "over";

/**
 * The size rule of a deck whose format sets `formatSize`: exactly that many
 * cards (CR 903.5a for Commander's 100), or at least that many when a
 * rulebreaker commander lifts the maximum (CR 903.5e).
 *
 * @param formatSize - The size the caller holds the deck to, a positive integer
 * @param exceptions - The command zone's rulebreaker exceptions
 *   (`deckConstructionExceptions`); empty for any other commander
 * @returns The minimum `formatSize`, and the maximum `formatSize` or none
 */
export function deckSizeRule(
  formatSize: number,
  exceptions: readonly RulebreakerException[]
): DeckSizeRule {
  return {
    minimum: formatSize,
    maximum: liftsMaximumDeckSize(exceptions) ? null : formatSize,
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
