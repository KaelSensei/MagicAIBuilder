/**
 * The deck size rule of a stored deck: the one function every size reader
 * calls (the editor counter, the deck list, the builder header and the deck
 * checks panel).
 *
 * Format-rules context, read by deck building; the rule itself is
 * `deckSizeRule` in `modules/format-rules`. CR 903.5e: a rulebreaker
 * commander (Whtz, the Bibliophile) may lift the deck's maximum size.
 *
 * @module deck/deck-size
 */
import { deckSizeRule, type DeckSizeRule } from "@/modules/format-rules";
import { commandZoneExceptions } from "./color-identity";
import { getFormatConfig } from "./formats";
import type { Deck } from "./types";

/**
 * Commander's deck size, 100 (CR 903.5a). The editor counter, the deck list and
 * the builder header hold every deck to it, whatever its format; a 60-card deck
 * still reads "/100" there (follow-up: hold each deck to its format's size).
 */
export const COMMANDER_DECK_SIZE = getFormatConfig("commander").deckSize;

/**
 * The size rule of `deck` when its format sets `formatSize`, with its
 * commander's rulebreaker exceptions applied (CR 903.5e).
 *
 * @param deck - The deck whose commander and partner may lift the maximum
 * @param formatSize - The size the reader holds the deck to: its format's
 *   `deckSize`, or {@link COMMANDER_DECK_SIZE} for the readers that show "/100"
 * @returns The deck's size rule
 */
export function deckSizeRuleOf(
  deck: Pick<Deck, "commander" | "partner">,
  formatSize: number
): DeckSizeRule {
  return deckSizeRule(formatSize, commandZoneExceptions(deck));
}

/**
 * A deck's card count as a counter shows it: "99/100" against a maximum, or the
 * bare count when the deck has none.
 *
 * @param cardCount - The cards the deck holds, its command zone included
 * @param rule - The deck's size rule
 * @param separator - What stands between the count and the maximum, such as "/" or " / "
 * @returns The counter's text
 */
export function formatDeckCount(
  cardCount: number,
  rule: DeckSizeRule,
  separator: string
): string {
  return rule.maximum === null
    ? String(cardCount)
    : `${cardCount}${separator}${rule.maximum}`;
}
