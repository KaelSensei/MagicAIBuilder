/**
 * Cards allowed in multiples in Commander (besides basic lands).
 * Nazgûl is capped at 9; Seven Dwarves at 7; all others are effectively unlimited.
 */

export const UNLIMITED_MULTIPLES = new Set([
  "Templar Knight",
  "Tempest Hawk",
  "Hare Apparent",
  "Persistent Petitioners",
  "Shadowborn Apostle",
  "Rat Colony",
  "Relentless Rats",
  "Dragon's Approach",
  "Slime Against Humanity",
  "Vazal, the Compleat",
  "Cid, Timeless Artificer",
]);

/** Cards with a specific per-deck cap (above 1 but not unlimited) */
export const CAPPED_MULTIPLES: Record<string, number> = {
  "Nazgûl": 9,
  "Seven Dwarves": 7,
};

/**
 * Returns the max allowed quantity for a card in a Commander deck.
 * - Basic lands → 99 (effectively unlimited)
 * - Unlimited multiples → 99
 * - Capped multiples → their specific cap
 * - Everything else → 1
 */
export function maxQuantity(cardName: string, typeLine: string): number {
  if (typeLine.toLowerCase().includes("basic land")) return 99;
  if (UNLIMITED_MULTIPLES.has(cardName)) return 99;
  if (CAPPED_MULTIPLES[cardName] !== undefined) return CAPPED_MULTIPLES[cardName];
  return 1;
}

export function allowsMultiples(cardName: string, typeLine: string): boolean {
  return maxQuantity(cardName, typeLine) > 1;
}
