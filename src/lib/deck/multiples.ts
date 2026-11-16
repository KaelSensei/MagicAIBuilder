/**
 * Copy limit per card name: basic lands, then cards allowed in multiples.
 * `deckCopyLimit` adds the deck's commander: a rulebreaker with no maximum deck
 * size (CR 903.5e) lifts the size cap on cards no copy rule limits.
 *
 * Primary detection: oracle text contains "a deck can have any number of cards named"
 * (works for any language since Scryfall returns english oracle text)
 *
 * Fallback hardcoded list: for cards where the oracle text check might miss edge cases.
 * Nazgûl: capped at 9 — oracle text says "up to nine"
 * Seven Dwarves: capped at 7 — oracle text says "up to seven"
 */
import { isBasicLand } from "@/lib/scryfall/type-line";
import { liftsMaximumDeckSize, type RulebreakerException } from "@/modules/format-rules";
import { getFormatConfig } from "./formats";
import type { DeckFormat } from "./formats";

/** Cards with a specific per-deck cap (above 1 but not unlimited) */
export const CAPPED_MULTIPLES: Record<string, number> = {
  "Nazgûl": 9,
  "Seven Dwarves": 7,
};

/**
 * Detect from oracle text if a card allows multiple copies.
 * Covers: Relentless Rats, Shadowborn Apostle, Dragon's Approach, etc.
 * Language-independent since Scryfall always returns English oracle text.
 */
export function oracleAllowsMultiples(oracleText: string): boolean {
  const lower = oracleText.toLowerCase();
  return (
    lower.includes("a deck can have any number of cards named") ||
    lower.includes("your deck can have any number of cards named")
  );
}

/**
 * Returns the max allowed quantity for a card.
 * @param cardName - Card name for capped-multiples lookup
 * @param typeLine - Card type line
 * @param oracleText - Oracle text for "any number" detection
 * @param format - Deck format (determines default max copies)
 * @returns Max allowed copies
 */
export function maxQuantity(
  cardName: string,
  typeLine: string,
  oracleText: string = "",
  format: DeckFormat = "commander"
): number {
  // CR 903.5b and CR 100.2a: basic lands are exempt from the copy limit.
  if (hasNoCopyRule(typeLine, oracleText)) return ROOM_BESIDE_COMMANDER;
  if (CAPPED_MULTIPLES[cardName] !== undefined) return CAPPED_MULTIPLES[cardName];
  return getFormatConfig(format).maxCopiesPerCard;
}

/**
 * The cap on a card no copy rule limits: the room a 100-card Commander deck
 * leaves beside its commander (CR 903.5a), a size cap rather than a copy rule.
 */
const ROOM_BESIDE_COMMANDER = 99;

/**
 * Whether no copy rule limits the card: a basic land (CR 903.5b, CR 100.2a) or
 * a card whose text allows any number (CR 101.1). Seven Dwarves and Nazgûl say
 * "up to", which is a copy rule.
 */
function hasNoCopyRule(typeLine: string, oracleText: string): boolean {
  return isBasicLand(typeLine) || oracleAllowsMultiples(oracleText);
}

/** The card text the copy limit reads. */
export interface CopyLimitCard {
  readonly name: string;
  readonly typeLine: string;
  readonly oracleText?: string;
}

/** The deck facts the copy limit reads. */
export interface CopyLimitDeck {
  /** The deck's format; Commander when unknown, as {@link maxQuantity} reads it */
  readonly format?: DeckFormat;
  /** The command zone's rulebreaker exceptions (CR 903.5e) */
  readonly exceptions: readonly RulebreakerException[];
}

/**
 * The copies of `card` a deck may hold: {@link maxQuantity}, except that under
 * a commander with no maximum deck size (Whtz, the Bibliophile; CR 903.5e) a
 * card no copy rule limits has no cap, since its 99 was the deck's size. The
 * singleton rule (CR 903.5b) and "up to N" texts are copy rules and stay.
 *
 * @param card - The card's name, type line and Oracle text
 * @param deck - The deck's format and its commander's rulebreaker exceptions
 * @returns The maximum number of copies; `Infinity` when nothing caps them
 */
export function deckCopyLimit(card: CopyLimitCard, deck: CopyLimitDeck): number {
  const oracleText = card.oracleText ?? "";
  if (hasNoCopyRule(card.typeLine, oracleText) && liftsMaximumDeckSize(deck.exceptions)) {
    return Number.POSITIVE_INFINITY;
  }
  return maxQuantity(card.name, card.typeLine, oracleText, deck.format);
}
