/**
 * Server-side fetch helper for the public deck page (/deck/[id]).
 *
 * The /api/deck/[id] route grants access when the deck is public OR the
 * requester is the owner. Owner detection relies on the session cookie, so
 * the page's server-side fetch must forward it — otherwise private decks
 * 404 even for their owner. Authenticated requests bypass the ISR cache so
 * one owner's view is never cached for anonymous visitors.
 */

import { buildViewerScopedRequestInit } from "@/lib/api/viewer-request";

export interface PublicCard {
  readonly id: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly isGameChanger: boolean;
}

export interface PublicDeckAuthor {
  readonly id: string;
  readonly name: string | null;
  readonly username: string | null;
  readonly image: string | null;
}

export interface PublicDeck {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly format: string;
  readonly targetBracket: number;
  readonly isAIGenerated: boolean;
  readonly isOwner: boolean;
  readonly cards: readonly PublicCard[];
  readonly user: PublicDeckAuthor | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function resolveBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

/** Fetch a deck for the public deck page, forwarding the viewer's cookies. */
export async function fetchPublicDeck(
  id: string,
  cookieHeader: string | null
): Promise<PublicDeck | null> {
  try {
    const res = await fetch(
      `${resolveBaseUrl()}/api/deck/${id}`,
      buildViewerScopedRequestInit(cookieHeader)
    );
    if (!res.ok) return null;
    const deck: PublicDeck = await res.json();
    return deck;
  } catch {
    return null;
  }
}
