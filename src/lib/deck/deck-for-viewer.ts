/**
 * Reads one deck as a given viewer may see it.
 *
 * Who may see what is decided by the deck visibility policy
 * (`canViewDeck` in `@/lib/community/deck-visibility-policy`), applied here
 * through `decideDeckView`. This module owns the two shapes: the owner gets
 * their whole deck, public or private, except its share token; a reader gets
 * a public deck through the {@link PUBLIC_DECK_SELECT} allowlist. A private or
 * missing deck yields null either way, so a stranger cannot tell a private
 * deck from a missing one. Both shapes carry the deck's two stored dates as
 * ISO strings, the form JSON gives them, so the page and the API agree.
 *
 * Shared by `GET /api/deck/[id]` and the public deck page (`/deck/[id]`), so
 * the page reads the database in-process instead of calling the app's own API
 * over HTTP.
 *
 * @module deck/deck-for-viewer
 */
import "server-only";
import { prisma } from "@/lib/db/prisma";
import { decideDeckView } from "@/lib/community/visible-deck";
import type { DeckDatesAsIso, PublicDeck } from "@/lib/deck/public-deck";
import {
  PUBLIC_DECK_AUTHOR_SELECT,
  PUBLIC_DECK_SELECT,
} from "@/lib/deck/public-deck-select";

/** A row with the deck's two stored dates, as Prisma reads them. */
interface StoredDeckDates {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** `row` with its stored dates as ISO strings; every other field unchanged. */
function withIsoDates<Row extends StoredDeckDates>(
  row: Row
): Omit<Row, keyof DeckDatesAsIso> & DeckDatesAsIso {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The owner's deck, whole except for its share token. */
function findOwnedDeck(id: string) {
  return prisma.deck.findUnique({
    where: { id },
    omit: { shareToken: true },
    include: { cards: true, user: { select: PUBLIC_DECK_AUTHOR_SELECT } },
  });
}

/**
 * A public deck, read through the public allowlist only.
 *
 * The `isPublic` filter is not the rule, which the policy already applied: it
 * closes the window between the facts read and this one, so a deck its owner
 * made private in the meantime is not served through the public allowlist.
 */
function findPublicDeck(id: string) {
  return prisma.deck.findUnique({
    where: { id, isPublic: true },
    select: PUBLIC_DECK_SELECT,
  });
}

/** The owner's whole deck, dates as ISO strings, flagged as theirs. */
type OwnedDeckView = Omit<
  NonNullable<Awaited<ReturnType<typeof findOwnedDeck>>>,
  keyof DeckDatesAsIso
> &
  DeckDatesAsIso & {
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
  const decision = await decideDeckView(id, viewerId);
  if (!decision?.allowed) return null;

  switch (decision.view) {
    case "owner": {
      const ownedDeck = await findOwnedDeck(id);
      return ownedDeck ? { ...withIsoDates(ownedDeck), isOwner: true } : null;
    }
    case "reader": {
      const publicDeck = await findPublicDeck(id);
      return publicDeck
        ? { ...withIsoDates(publicDeck), isOwner: false }
        : null;
    }
    default: {
      const unreachable: never = decision.view;
      return unreachable;
    }
  }
}
