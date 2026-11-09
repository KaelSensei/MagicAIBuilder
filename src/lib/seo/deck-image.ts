/**
 * Where a deck's social image lives, shared by the deck page's metadata and the
 * image route. Kept apart from the data loader so the page does not import
 * Prisma to build a URL.
 */

/** Open Graph's recommended size, which X's large summary card also uses. */
export const DECK_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * Path of a deck's social image.
 *
 * `v` changes whenever the deck does, so a chat app that caches previews by URL
 * fetches the new image after an edit. The route ignores it: the image is built
 * from the database, never from the URL.
 *
 * @param deckId - the deck's id
 * @param updatedAt - the deck's `updatedAt`, as the public deck API returns it
 * @returns a site-relative path, resolved against `metadataBase`
 */
export function deckImagePath(deckId: string, updatedAt: string): string {
  const path = `/og/deck/${encodeURIComponent(deckId)}`;
  const version = Date.parse(updatedAt);
  return Number.isNaN(version) ? path : `${path}?v=${version}`;
}
