/**
 * Reads one deck as a given viewer may see it.
 *
 * The owner gets their whole deck, public or private, except its share token.
 * Anyone else gets a public deck through the {@link PUBLIC_DECK_SELECT}
 * allowlist, and nothing for a private or missing deck, so a stranger cannot
 * tell a private deck from a missing one.
 *
 * Shared by `GET /api/deck/[id]` and the public deck page (`/deck/[id]`), so
 * the page reads the database in-process instead of calling the app's own API
 * over HTTP.
 *
 * @module deck/deck-for-viewer
 */
import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { PublicDeck } from "@/lib/deck/public-deck";
import {
  PUBLIC_DECK_AUTHOR_SELECT,
  PUBLIC_DECK_SELECT,
} from "@/lib/deck/public-deck-select";

/** The viewer's own deck, whole except for its share token. */
function findOwnedDeck(id: string, ownerId: string) {
  return prisma.deck.findUnique({
    where: { id, userId: ownerId },
    omit: { shareToken: true },
    include: { cards: true, user: { select: PUBLIC_DECK_AUTHOR_SELECT } },
  });
}

/** A public deck, read through the public allowlist only. */
function findPublicDeck(id: string) {
  return prisma.deck.findUnique({
    where: { id, isPublic: true },
    select: PUBLIC_DECK_SELECT,
  });
}

/** The owner's whole deck, flagged as theirs. */
type OwnedDeckView = NonNullable<Awaited<ReturnType<typeof findOwnedDeck>>> & {
  readonly isOwner: true;
};

/** What {@link findDeckForViewer} returns: the owner's view or the public one. */
export type DeckForViewer = OwnedDeckView | PublicDeck;

/**
 * Finds a deck as `viewerId` may see it.
 *
 * @param id - the deck id; callers reject malformed ids before calling
 * @param viewerId - the signed-in user's id, or null for a signed-out viewer
 * @returns the owner's whole deck, the public view of a public deck, or null
 *   when the deck is missing or private to someone else
 * @throws whatever Prisma throws when the database is unavailable
 */
export async function findDeckForViewer(
  id: string,
  viewerId: string | null
): Promise<DeckForViewer | null> {
  // A signed-out viewer owns nothing, so never match a deck whose userId is null.
  const ownedDeck =
    viewerId === null ? null : await findOwnedDeck(id, viewerId);
  if (ownedDeck) return { ...ownedDeck, isOwner: true };

  const publicDeck = await findPublicDeck(id);
  if (!publicDeck) return null;
  return { ...publicDeck, isOwner: false };
}
