/**
 * Text folded into a form a file name can carry.
 *
 * Shared kernel. The playtest log names its text and JSON exports after the
 * deck through `fileStem`; the deck export and the shopping list name theirs
 * through `underscoreFileStem`, the older rule they shipped with. Both keep
 * an accented letter as its base letter through `text/transliterate`. Not
 * responsible for: the commander slug, whose URL form lowercases and drops
 * punctuation (`lib/meta/commander-slug.ts`), or the extension, which each
 * export adds itself.
 *
 * @module text/slug
 */
import { spellOutLigatures, stripDiacritics } from "./transliterate";

/**
 * `name` with every letter folded to ASCII: accents dropped from their base
 * letter, the Æ and Œ ligatures spelled out as Oracle text does.
 */
function foldLetters(name: string): string {
  return spellOutLigatures(stripDiacritics(name));
}

/**
 * The stem of an export file named after `name`.
 *
 * An accented letter is kept as its base letter and a ligature is spelled
 * out, so "Lim-Dûl" gives "Lim-Dul" and "Æther" gives "Aether". Each run of
 * characters other than ASCII letters and digits then becomes one hyphen, a
 * leading or trailing hyphen is dropped, and the case is kept, so
 * "My Deck! v2" gives "My-Deck-v2". "deck" when nothing of the name survives,
 * so the export always has a name.
 *
 * @returns ASCII letters, digits and hyphens, never empty
 */
export function fileStem(name: string): string {
  return (
    foldLetters(name)
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "") || "deck"
  );
}

/**
 * The lowercase, underscored stem of an export file named after `name`, the
 * rule the deck export and the shopping list have always used.
 *
 * An accented letter is kept as its base letter and a ligature is spelled
 * out, then every character other than an ASCII letter or digit becomes one
 * underscore, one per character, and the result is lowercased: "My Deck! v2"
 * gives "my_deck__v2". Unlike {@link fileStem}, runs are not collapsed, the
 * ends are not trimmed and an empty name gives an empty stem, so a name
 * without accents gives byte for byte what it gave before the accent fix.
 *
 * @returns lowercase ASCII letters, digits and underscores, possibly empty
 */
export function underscoreFileStem(name: string): string {
  return foldLetters(name)
    .replaceAll(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}
