/**
 * Letters folded towards ASCII, one step at a time.
 *
 * Shared kernel, pure. The commander slug (`lib/meta/commander-slug.ts`), the
 * export file stems (`lib/text/slug.ts`) and the MTGTop8 archetype matcher
 * (`modules/meta-insights/infrastructure/mtgtop8.ts`) fold a name the same
 * way, so the rule lives once here. Not responsible for: lowercasing,
 * punctuation or whitespace, which each caller decides for itself.
 *
 * @module text/transliterate
 */

/**
 * `text` with every accented letter kept as its base letter: "Lim-Dûl" gives
 * "Lim-Dul", "Éowyn" gives "Eowyn".
 *
 * Unicode NFD splits an accented letter into its base letter and a combining
 * mark; the mark is then dropped. Case, punctuation and whitespace are kept.
 * A ligature such as "Æ" has no decomposition and stays whole; see
 * {@link spellOutLigatures}.
 *
 * @returns `text` without combining marks, in NFD form
 */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replaceAll(/\p{M}/gu, "");
}

/**
 * "Æ" → "Ae", "œ" → "oe". Unicode NFD leaves these ligatures whole, so
 * {@link stripDiacritics} keeps them while Oracle text spells them out
 * ("Aether Vial" on https://api.scryfall.com/cards/named, read 2026-11-11).
 */
const LIGATURES: ReadonlyMap<string, string> = new Map([
  ["æ", "ae"],
  ["Æ", "Ae"],
  ["œ", "oe"],
  ["Œ", "Oe"],
]);

/**
 * `text` with the Æ and Œ ligatures written as two letters, in the case of
 * the ligature: "Æther" gives "Aether". Every other character is kept.
 */
export function spellOutLigatures(text: string): string {
  return text.replaceAll(
    /[æÆœŒ]/g,
    (ligature) => LIGATURES.get(ligature) ?? ligature
  );
}
