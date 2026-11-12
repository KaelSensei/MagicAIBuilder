/**
 * Cache contract between the share page and the share-link endpoint.
 *
 * `/share/[token]` reads the deck behind a share link through
 * `GET /api/share/[token]` and keeps the answer in Next's data cache for
 * {@link SHARE_LINK_REVALIDATE_SECONDS}, so a popular link costs one database
 * read a minute, not one per visitor. A link the owner revokes must stop
 * working at once (owner decision OD-12, 2026-11-10), so each entry is tagged
 * with its token and `DELETE /api/decks/[id]/share` purges that tag before it
 * answers. Both sides import the tag from here so they cannot drift apart.
 *
 * @module deck/share-link-cache
 */

/** How long the share page may serve a cached deck without asking the database again. */
export const SHARE_LINK_REVALIDATE_SECONDS = 60;

/**
 * The Next cache tag of every page and data entry read through one share token.
 *
 * @param token - a share token as issued by `POST /api/decks/[id]/share`
 * @returns the tag to pass to `fetch(..., { next: { tags } })` and `revalidateTag`
 */
export function shareLinkCacheTag(token: string): string {
  return `share-link:${token}`;
}
