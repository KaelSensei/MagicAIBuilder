/**
 * Which side deck a card fits, read from its type line: a planar deck takes
 * planes and phenomena, a scheme deck schemes, an Attraction deck Attractions
 * (I-103 requirement 1.2).
 *
 * Format-rules context, domain layer; `side-decks.ts` is its caller.
 * Rules: CR 205.1a (the long dash), 311 (plane), 312 (phenomenon), 314
 * (scheme), 717.1 and 205.3g (Attraction, an artifact subtype).
 *
 * @module format-rules/side-card-types
 */

/** A type line's words: card types and supertypes, then subtypes. */
interface TypeWords {
  readonly types: ReadonlySet<string>;
  readonly subtypes: ReadonlySet<string>;
}

/** The non-empty words of one part of a type line. */
function wordsOf(part: string): ReadonlySet<string> {
  return new Set(part.split(/\s+/).filter((word) => word.length > 0));
}

/**
 * Splits a type line at its long dash (CR 205.1a): types and supertypes on the
 * left, subtypes on the right, so "Planeswalker" never reads as "Plane".
 */
function typeWordsOf(typeLine: string): TypeWords {
  const [left = "", right = ""] = typeLine.split("—");
  return { types: wordsOf(left), subtypes: wordsOf(right) };
}

/** A plane (CR 311) or a phenomenon (CR 312), such as "Plane — Dominaria". */
export function isPlanarCardType(typeLine: string): boolean {
  const { types } = typeWordsOf(typeLine);
  return types.has("Plane") || types.has("Phenomenon");
}

/** A phenomenon (CR 312), which has no subtype (CR 205.3r). */
export function isPhenomenonType(typeLine: string): boolean {
  return typeWordsOf(typeLine).types.has("Phenomenon");
}

/** A scheme, ongoing or not (CR 314), such as "Ongoing Scheme". */
export function isSchemeType(typeLine: string): boolean {
  return typeWordsOf(typeLine).types.has("Scheme");
}

/** An Attraction (CR 717.1), an artifact subtype: "Artifact — Attraction". */
export function isAttractionType(typeLine: string): boolean {
  return typeWordsOf(typeLine).subtypes.has("Attraction");
}
