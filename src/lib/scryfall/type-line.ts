/**
 * Rules facts read from a card's English type line, as Scryfall prints it:
 * supertypes and card types, then an em dash and the subtypes
 * ("Basic Snow Land — Forest").
 *
 * @module scryfall/type-line
 */

/** Separates the supertypes and card types from the subtypes. */
const SUBTYPE_SEPARATOR = "—";

/**
 * Whether a card is a basic land.
 *
 * CR 205.4c: a land is basic exactly when it has the "basic" supertype. So
 * Snow-Covered Forest ("Basic Snow Land — Forest") and Wastes ("Basic Land")
 * are basic, while Dryad Arbor ("Land Creature — Forest Dryad") is not, even
 * with a basic land type. CR 205.4a: supertypes are printed before the card
 * types, so only the words before the em dash are read. Every basic-land
 * exemption depends on this test, such as the Commander singleton rule
 * (CR 903.5b) and the constructed four-copy limit (CR 100.2a).
 *
 * @param typeLine - the card's English type line
 * @returns true when the card has both the basic supertype and the land type
 */
export function isBasicLand(typeLine: string): boolean {
  const [types = ""] = typeLine.split(SUBTYPE_SEPARATOR, 1);
  const words = new Set(types.toLowerCase().split(/\s+/));
  return words.has("basic") && words.has("land");
}
