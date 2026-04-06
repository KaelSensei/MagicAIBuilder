/**
 * Cards allowed in multiples (besides basic lands).
 *
 * Primary detection: oracle text contains "a deck can have any number of cards named"
 * (works for any language since Scryfall returns english oracle text)
 *
 * Fallback hardcoded list: for cards where the oracle text check might miss edge cases.
 * Nazgûl: capped at 9 — oracle text says "up to nine"
 * Seven Dwarves: capped at 7 — oracle text says "up to seven"
 */
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
  if (typeLine.toLowerCase().includes("basic land")) return 99;
  if (oracleAllowsMultiples(oracleText)) return 99;
  if (CAPPED_MULTIPLES[cardName] !== undefined) return CAPPED_MULTIPLES[cardName];
  return getFormatConfig(format).maxCopiesPerCard;
}

/**
 * Whether a card can have more than 1 copy in the given format.
 * @param cardName - Card name
 * @param typeLine - Card type line
 * @param oracleText - Oracle text
 * @param format - Deck format
 * @returns True if the card allows more than 1 copy
 */
export function allowsMultiples(
  cardName: string,
  typeLine: string,
  oracleText: string = "",
  format: DeckFormat = "commander"
): boolean {
  return maxQuantity(cardName, typeLine, oracleText, format) > 1;
}
