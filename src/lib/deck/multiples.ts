/**
 * Copy limit per card name: basic lands, then cards allowed in multiples.
 *
 * Primary detection: oracle text contains "a deck can have any number of cards named"
 * (works for any language since Scryfall returns english oracle text)
 *
 * Fallback hardcoded list: for cards where the oracle text check might miss edge cases.
 * Nazgûl: capped at 9 — oracle text says "up to nine"
 * Seven Dwarves: capped at 7 — oracle text says "up to seven"
 */
import { isBasicLand } from "@/lib/scryfall/type-line";
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
  if (isBasicLand(typeLine)) return 99;
  if (oracleAllowsMultiples(oracleText)) return 99;
  if (CAPPED_MULTIPLES[cardName] !== undefined) return CAPPED_MULTIPLES[cardName];
  return getFormatConfig(format).maxCopiesPerCard;
}
