/**
 * Server-side fetch helper for the public deck page (/deck/[id]).
 *
 * The /api/deck/[id] route grants access when the deck is public OR the
 * requester is the owner. Owner detection relies on the session cookie, so
 * the page's server-side fetch must forward it — otherwise private decks
 * 404 even for their owner. Authenticated requests bypass the ISR cache so
 * one owner's view is never cached for anonymous visitors.
 */

import {
  buildViewerScopedRequestInit,
  resolveAppBaseUrl,
} from "@/lib/api/viewer-request";
import type { PublicDeckRecord } from "@/lib/deck/public-deck-select";

/** A card of a public deck, exactly as the public allowlist exposes it. */
export type PublicCard = Readonly<PublicDeckRecord["cards"][number]>;

/** The author byline of a public deck. */
export type PublicDeckAuthor = Readonly<NonNullable<PublicDeckRecord["user"]>>;

/**
 * What every viewer of a public deck receives. The owner receives their whole
 * deck, which is a superset of this shape.
 */
export type PublicDeck = Readonly<Omit<PublicDeckRecord, "cards" | "user">> & {
  readonly cards: readonly PublicCard[];
  readonly user: PublicDeckAuthor | null;
  readonly isOwner: boolean;
};

/** Fetch a deck for the public deck page, forwarding the viewer's cookies. */
export async function fetchPublicDeck(
  id: string,
  cookieHeader: string | null
): Promise<PublicDeck | null> {
  let res: Response;
  try {
    res = await fetch(
      `${resolveAppBaseUrl()}/api/deck/${id}`,
      { ...buildViewerScopedRequestInit(cookieHeader), signal: AbortSignal.timeout(15_000) }
    );
  } catch {
    throw new Error("PUBLIC_DECK_UNAVAILABLE");
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("PUBLIC_DECK_UNAVAILABLE");
  try {
    const deck: PublicDeck = await res.json();
    return deck;
  } catch {
    throw new Error("PUBLIC_DECK_UNAVAILABLE");
  }
}
