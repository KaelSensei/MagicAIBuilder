/**
 * Which public pages are offered to search engines (I-34, spec §4).
 *
 * Page metadata and the sitemap both call these rules, so a page cannot carry
 * `noindex` while the sitemap still lists it, or the reverse. A page that is
 * not indexable still renders for visitors: it declares `noindex` and is left
 * out of the sitemap. robots.txt never disallows it, because a crawler has to
 * fetch the page to read its `noindex`.
 */

/** The fewest public decks a profile lists before it is offered for indexing. */
const MIN_PUBLIC_DECKS_TO_INDEX_PROFILE = 1;

/**
 * Whether a public profile is offered to search engines.
 *
 * A profile page lists only its owner's public decks, so a profile without one
 * is an empty page however many private decks stand behind it.
 *
 * @param publicDeckCount Decks the owner marked `isPublic`.
 * @returns True once the profile lists at least one public deck.
 */
export function isIndexableProfile(publicDeckCount: number): boolean {
  return publicDeckCount >= MIN_PUBLIC_DECKS_TO_INDEX_PROFILE;
}
