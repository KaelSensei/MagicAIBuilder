/**
 * Where a deck's social image lives, shared by the deck page's metadata and the
 * image route. Kept apart from the data loader so the page does not import
 * Prisma to build a URL.
 */

/** Open Graph's recommended size, which X's large summary card also uses. */
export const DECK_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** A card of a public deck, reduced to what the deck image reads. */
interface DeckImageSourceCard {
  readonly name: string;
  readonly quantity: number;
  readonly colorIdentity: readonly string[];
  readonly isCommander: boolean;
  readonly isPartner: boolean;
}

/** The parts of a public deck, as the deck page receives it, that the image prints. */
export interface DeckImageSource {
  readonly name: string;
  readonly cards: readonly DeckImageSourceCard[];
  readonly user: {
    readonly name: string | null;
    readonly username: string | null;
  } | null;
}

/**
 * Version token of a deck's social image.
 *
 * It is derived from what the image prints: the deck name, the commanders and
 * their colours, the card count and the author's display name. A chat app that
 * caches previews by URL then fetches a new image when one of those changes,
 * and only then. It is not the deck's `updatedAt`, which the public deck API
 * does not expose.
 *
 * @param deck - the public deck as the deck page receives it
 * @returns a short, stable token
 */
export function deckImageVersion(deck: DeckImageSource): string {
  const commanders = deck.cards
    .filter((card) => card.isCommander || card.isPartner)
    .map((card) => [card.name, card.isPartner, [...card.colorIdentity].sort()]);
  const cardCount = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
  const displayName = deck.user?.name?.trim();
  const author = displayName ? displayName : (deck.user?.username ?? null);

  return fnv1a(JSON.stringify([deck.name, commanders, cardCount, author]));
}

/**
 * 32-bit FNV-1a hash, in base 36. A cache key, not a security boundary.
 *
 * @param text - the text to hash
 * @returns the hash
 */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Path of a deck's social image.
 *
 * The route ignores `v`: the image is built from the database, never from the
 * URL. `v` only makes the URL change when the image does.
 *
 * @param deckId - the deck's id
 * @param version - the image's version, from {@link deckImageVersion}
 * @returns a site-relative path, resolved against `metadataBase`
 */
export function deckImagePath(deckId: string, version: string): string {
  return `/og/deck/${encodeURIComponent(deckId)}?v=${encodeURIComponent(version)}`;
}
