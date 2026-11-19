/**
 * The commander slug: the one URL form of a commander's name that the commander
 * pages, the sitemap, EDHREC, the meta cache and the MTGTop8 archetype lookup
 * share.
 *
 * Community context (COM-02): the commander decks page and the reader behind
 * it (`prisma-commander-deck-reader.ts`, which matches the same slug in SQL) own the
 * slug; the sitemap lists the pages it names, and the meta-insights context
 * imports it for its route URLs, cache keys and archetype matching. Kept a
 * leaf with no community import so that `meta-insights/infrastructure/mtgtop8.ts`
 * can fold names the same way without reaching the community reads.
 *
 * @module community/commander-slug
 */
import { stripDiacritics } from "@/lib/text/transliterate";

/**
 * Converts a commander's name to its slug, the URL form EDHREC uses and the commander pages,
 * the sitemap and the meta cache share: "Lim-Dûl the Necromancer" → "lim-dul-the-necromancer".
 *
 * `stripDiacritics` keeps an accented letter as its base letter (Unicode NFD, combining marks
 * dropped). The strip then drops everything else that is not an ASCII letter, a digit,
 * whitespace or a hyphen; a ligature such as "Æ" goes with it, and the SQL twin below keeps
 * that rule, so do not spell ligatures out here. Whitespace is trimmed, and each run of it
 * becomes one hyphen. EDHREC answers 200 for the transliterated slug and 403 for the slug with
 * the accented letter dropped
 * (https://json.edhrec.com/pages/commanders/lim-dul-the-necromancer.json, read 2026-11-11).
 *
 * The commander deck route computes the same slug in SQL, behind an expression index. If you
 * change this function, change that query, its index (in a new migration) and
 * `commander-slug-parity.test.ts` in the same commit.
 *
 * @param name A commander's name, as Scryfall prints it.
 * @returns Lowercase ASCII letters, digits and hyphens; "" when none of them survive.
 */
export function commanderToSlug(name: string): string {
  return stripDiacritics(name)
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-");
}

/**
 * Lowercase letters, digits and hyphens, with at least one letter or digit.
 * Linear: the leading `-*` and the `[a-z0-9]` that ends it never overlap.
 */
const COMMANDER_SLUG_PATTERN = /^-*[a-z0-9][a-z0-9-]*$/;

/**
 * Whether `commanderToSlug` could have produced this slug from a name with at
 * least one letter or digit in it.
 *
 * `commanderToSlug` only ever emits lowercase letters, digits and hyphens. A
 * slug with anything else, or with only hyphens, names no commander.
 *
 * @param slug A commander slug, as a route receives it.
 * @returns True when the slug can name a commander.
 */
export function isCommanderSlug(slug: string): boolean {
  return COMMANDER_SLUG_PATTERN.test(slug);
}
