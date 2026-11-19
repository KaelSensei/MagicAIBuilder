/**
 * The deck size rule of a stored deck: the one function every size reader
 * calls (the editor counter, the deck list, the builder header and the deck
 * checks panel).
 *
 * Format-rules context, read by deck building; the rule itself is
 * `deckSizeRule` in `modules/format-rules`. CR 100.2a: a constructed deck
 * has at least 60 cards and no maximum; CR 903.5a: a Commander deck holds
 * exactly 100. CR 903.5e: a rulebreaker commander (Whtz, the Bibliophile)
 * may lift the deck's maximum size.
 *
 * @module deck/deck-size
 */
import {
  deckSizeRule,
  type DeckSizeRule,
  type FormatDeckSize,
} from "@/modules/format-rules";
import { commandZoneExceptions } from "./color-identity";
import { getFormatConfig } from "./formats";
import type { Deck } from "./types";

/**
 * The deck size `format` sets: its `deckSize` and whether that is exact or a
 * minimum (`deckSizeBound`).
 *
 * @param format - A stored format; an unknown one reads as Commander
 *   (`getFormatConfig`)
 * @returns The format's deck size
 */
export function formatDeckSize(format: string): FormatDeckSize {
  const { deckSize, deckSizeBound } = getFormatConfig(format);
  return { cards: deckSize, bound: deckSizeBound };
}

/**
 * Commander's deck size, exactly 100 (CR 903.5a), for a reader with no stored
 * deck to take a format from, such as the AI deck check of a Commander build.
 */
export const COMMANDER_DECK_SIZE = formatDeckSize("commander");

/**
 * The size rule of `deck` when its format sets `formatSize`, with its
 * commander's rulebreaker exceptions applied (CR 903.5e).
 *
 * @param deck - The deck whose commander and partner may lift the maximum
 * @param formatSize - The size the reader holds the deck to, such as its
 *   format's ({@link formatDeckSize}) or {@link COMMANDER_DECK_SIZE}
 * @returns The deck's size rule
 */
export function deckSizeRuleOf(
  deck: Pick<Deck, "commander" | "partner">,
  formatSize: FormatDeckSize
): DeckSizeRule {
  return deckSizeRule(formatSize, commandZoneExceptions(deck));
}

/**
 * The size rule of `deck` in its own format: exactly 100 for Commander
 * (CR 903.5a), exactly 60 for Brawl (CR 903.12d) and Oathbreaker, at least 60
 * for a constructed format (CR 100.2a), with its commander's rulebreaker
 * exceptions applied (CR 903.5e). Every deck counter reads it.
 *
 * @param deck - The deck whose format sets the size and whose commander and
 *   partner may lift the maximum; an unknown format reads as Commander
 *   (`getFormatConfig`)
 * @returns The deck's size rule
 */
export function deckSizeRuleInFormat(
  deck: Pick<Deck, "format" | "commander" | "partner">
): DeckSizeRule {
  return deckSizeRuleOf(deck, formatDeckSize(deck.format));
}

/**
 * The cards a loaded deck holds against its size rule: every copy in the main
 * zone, plus the commander and the partner (CR 903.5a: the commander counts
 * toward the 100). The sideboard, the maybeboard and a companion stay out.
 *
 * @param deck - The deck's rows as the store holds them
 * @returns The card count the editor and the builder title bar show
 */
export function countDeckCards(
  deck: Pick<Deck, "cards" | "commander" | "partner">
): number {
  const mainCopies = deck.cards
    .filter((card) => card.zone === "main")
    .reduce((sum, card) => sum + card.quantity, 0);
  return mainCopies + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0);
}

/**
 * A deck's card count as a counter shows it: "99/100" against a maximum,
 * "63/60+" against a constructed format's minimum (CR 100.2a: 60 or more), or
 * the bare count when a rulebreaker commander lifts the maximum (CR 903.5e).
 *
 * @param cardCount - The cards the deck holds, its command zone included
 * @param rule - The deck's size rule
 * @param separator - What stands between the count and the size, such as "/" or " / "
 * @returns The counter's text
 */
export function formatDeckCount(
  cardCount: number,
  rule: DeckSizeRule,
  separator: string
): string {
  if (rule.maximum !== null) return `${cardCount}${separator}${rule.maximum}`;
  if (rule.formatBound === "minimum") {
    return `${cardCount}${separator}${rule.minimum}+`;
  }
  return String(cardCount);
}
