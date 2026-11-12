import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * Whether a card may be designated as a commander.
 *
 * CR 903.3 and 903.3a (comprehensive rules of 2026-08-07): a legendary
 * creature, a legendary Vehicle, a legendary Spacecraft with a power/toughness
 * box, or a card whose text says it can be your commander. A multi-face card is
 * judged by its front face.
 *
 * @param card - Scryfall card data
 * @returns true when the card can fill a command slot on its own
 */
export function isCommanderEligible(card: ScryfallCard): boolean {
  const front = card.card_faces?.[0];
  const typeLine = (front?.type_line ?? card.type_line).toLowerCase();
  const oracleText = (
    front?.oracle_text ??
    card.oracle_text ??
    ""
  ).toLowerCase();

  if (oracleText.includes("can be your commander")) return true;
  if (!typeLine.includes("legendary")) return false;
  if (typeLine.includes("creature") || typeLine.includes("vehicle")) {
    return true;
  }
  return (
    typeLine.includes("spacecraft") &&
    (front?.power ?? card.power) !== undefined
  );
}

/**
 * Whether a card is a Background, which can only be a second commander beside
 * a commander that says "Choose a Background".
 *
 * @param card - Scryfall card data
 * @returns true when the card has the Background subtype
 */
export function isBackground(card: ScryfallCard): boolean {
  return /\bbackground\b/i.test(card.type_line);
}
