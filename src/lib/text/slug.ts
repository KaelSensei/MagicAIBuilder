/**
 * Text folded into a form a file name can carry.
 *
 * Shared kernel. The playtest log names its text and JSON exports after the
 * deck through `fileStem`. Not responsible for: the commander slug, whose URL
 * form lowercases and transliterates (`lib/meta/commander-slug.ts`), or the
 * extension, which each export adds itself.
 *
 * @module text/slug
 */

/**
 * The stem of an export file named after `name`.
 *
 * Each run of characters other than ASCII letters and digits becomes one
 * hyphen, a leading or trailing hyphen is dropped, and the case is kept, so
 * "My Deck! v2" gives "My-Deck-v2". An accented letter is folded away with the
 * punctuation ("Ürza" gives "rza"), not transliterated. "deck" when nothing of
 * the name survives, so the export always has a name.
 *
 * @returns ASCII letters, digits and hyphens, never empty
 */
export function fileStem(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "") || "deck"
  );
}
