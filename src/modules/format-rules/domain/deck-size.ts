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
 * (CR 100.2a) is not modelled.
 * Not responsible for: which size a format has (`FormatConfig.deckSize`, given
 * by the caller) or how a screen words the count.
 *
 * @module format-rules/deck-size
 */

/** The cards a deck may hold: at least `minimum`, at most `maximum`. */
export interface DeckSizeRule {
  readonly minimum: number;
  readonly maximum: number;
}

/** Where a card count stands against a {@link DeckSizeRule}. */
export type DeckSizeStatus = "short" | "legal" | "over";

/**
 * The size rule of a deck whose format sets `formatSize`: exactly that many
 * cards (CR 903.5a for Commander's 100).
 *
 * @param formatSize - The size the caller holds the deck to, a positive integer
 * @returns A rule whose minimum and maximum are both `formatSize`
 */
export function deckSizeRule(formatSize: number): DeckSizeRule {
  return { minimum: formatSize, maximum: formatSize };
}

/**
 * Where `cardCount` stands against `rule`.
 *
 * @param cardCount - The cards the deck holds, its command zone included
 * @param rule - The deck's size rule
 * @returns `short` under the minimum, `over` above the maximum, `legal` otherwise
 */
export function deckSizeStatus(
  cardCount: number,
  rule: DeckSizeRule
): DeckSizeStatus {
  if (cardCount < rule.minimum) return "short";
  if (cardCount > rule.maximum) return "over";
  return "legal";
}
