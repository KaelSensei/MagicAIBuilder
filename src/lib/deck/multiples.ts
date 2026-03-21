/**
 * Cards allowed in multiples in Commander (besides basic lands).
 *
 * Primary detection: oracle text contains "a deck can have any number of cards named"
 * (works for any language since Scryfall returns english oracle text)
 *
 * Fallback hardcoded list: for cards where the oracle text check might miss edge cases.
 * Nazgûl: capped at 9 — oracle text says "up to nine"
 * Seven Dwarves: capped at 7 — oracle text says "up to seven"
 */

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
 * Returns the max allowed quantity for a card in a Commander deck.
 * - Basic lands → 99 (effectively unlimited)
 * - Oracle text says "a deck can have any number" → 99
 * - Capped multiples (Nazgûl ×9, Seven Dwarves ×7) → their specific cap
 * - Everything else → 1
 */
export function maxQuantity(
  cardName: string,
  typeLine: string,
  oracleText: string = ""
): number {
  if (typeLine.toLowerCase().includes("basic land")) return 99;
  if (oracleAllowsMultiples(oracleText)) return 99;
  if (CAPPED_MULTIPLES[cardName] !== undefined) return CAPPED_MULTIPLES[cardName];
  return 1;
}

export function allowsMultiples(
  cardName: string,
  typeLine: string,
  oracleText: string = ""
): boolean {
  return maxQuantity(cardName, typeLine, oracleText) > 1;
}
