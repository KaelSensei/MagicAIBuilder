/**
 * Deck names: the longest name a deck may have, and the name a copy of a deck
 * gets.
 *
 * Deck-building context, pure domain rule. The limit is the rename's rule
 * (`deckNameSchema` in `lib/validation/deck.ts`, the builder's name field),
 * which the duplicate route applies to the copy's name too. The copy's name is
 * worded in the player's language by the caller (`useDeckDuplication`); this
 * module only fits it to the limit (I-04).
 *
 * @module deck/deck-name
 */

/** The longest deck name a rename accepts, in UTF-16 code units, as zod and `maxLength` count. */
export const DECK_NAME_MAX_LENGTH = 200;

/**
 * The name of a copy of a deck, fitted to {@link DECK_NAME_MAX_LENGTH}.
 *
 * When the worded name would be too long, the deck's name is shortened, never
 * the wording, so the copy still reads as a copy. The cut never splits a
 * character, and drops the spaces it leaves before the wording.
 *
 * @param deckName - the name of the deck being copied
 * @param wordCopyName - words a copy's name from a deck name, in the player's
 *   language (« {name} (copie) »); it may place the name anywhere
 * @returns the copy's name, at most {@link DECK_NAME_MAX_LENGTH} code units
 *   long whenever the wording alone is shorter than the limit
 */
export function copyDeckName(
  deckName: string,
  wordCopyName: (name: string) => string
): string {
  const room = DECK_NAME_MAX_LENGTH - wordCopyName("").length;
  return wordCopyName(cutToLength(deckName, room));
}

/** `text` itself when it fits in `maxLength` code units; otherwise its longest start that does, without trailing spaces. */
function cutToLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  let cut = "";
  for (const character of text) {
    if (cut.length + character.length > maxLength) break;
    cut += character;
  }
  return cut.trimEnd();
}
