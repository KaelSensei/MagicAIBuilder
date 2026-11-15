/**
 * Reads a deck's visibility facts and applies the deck visibility policy for
 * a deck opened by id.
 *
 * Community context. The rule itself is `canViewDeck` in
 * `@/lib/community/deck-visibility-policy`; this module is the repository
 * side: one query for the facts, one decision. `findVisibleDeck` serves the
 * community routes (comments, ratings, votes, reports), which need the row;
 * `decideDeckView` serves `findDeckForViewer` (`@/lib/deck/deck-for-viewer`),
 * which reads a different shape for the owner and for a reader.
 *
 * `prismaDeckVisibilityReader` serves the vote and rating use cases, which
 * read the same facts and decide for themselves (`canActOnDeck`).
 *
 * Not responsible for: a deck opened through its share link, which
 * `@/lib/deck/shared-deck-lookup` reads by token.
 *
 * @module community/visible-deck
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DeckVisibilityReader } from "@/lib/community/deck-interaction-ports";
import {
  canViewDeck,
  DECK_ACCESS_BY_ID,
  type DeckViewDecision,
  type DeckVisibilityFacts,
} from "@/lib/community/deck-visibility-policy";

/** The columns the visibility rule reads, and the id the callers act on. */
const DECK_VISIBILITY_SELECT = {
  id: true,
  userId: true,
  isPublic: true,
  shareEnabled: true,
} as const satisfies Prisma.DeckSelect;

/** A deck the viewer is allowed to see, reduced to what the checks need. */
export type VisibleDeck = Prisma.DeckGetPayload<{
  select: typeof DECK_VISIBILITY_SELECT;
}>;

/** The visibility facts of a stored deck, or null when no deck has this id. */
function readDeckVisibility(deckId: string): Promise<VisibleDeck | null> {
  return prisma.deck.findUnique({
    where: { id: deckId },
    select: DECK_VISIBILITY_SELECT,
  });
}

/** The row's columns under the names the policies read. */
function toVisibilityFacts(deck: VisibleDeck): DeckVisibilityFacts {
  return {
    ownerId: deck.userId,
    isPublic: deck.isPublic,
    shareEnabled: deck.shareEnabled,
  };
}

/** The policy's decision for a deck opened by id. */
function decideById(
  deck: VisibleDeck,
  viewerId: string | null
): DeckViewDecision {
  return canViewDeck(toVisibilityFacts(deck), viewerId, DECK_ACCESS_BY_ID);
}

/**
 * The `DeckVisibilityReader` port over the shared Prisma client: the facts
 * only, for use cases that take the decision themselves.
 */
export const prismaDeckVisibilityReader: DeckVisibilityReader = {
  async readVisibility(deckId) {
    const deck = await readDeckVisibility(deckId);
    return deck ? toVisibilityFacts(deck) : null;
  },
};

/**
 * Loads a deck and confirms the viewer may see it.
 *
 * @param deckId Deck identifier from the route.
 * @param viewerId Signed-in user id, or null for anonymous viewers.
 * @returns The deck when visible, otherwise null, so a route answers a
 *   private deck and a missing deck alike.
 * @throws whatever Prisma throws when the database is unavailable
 */
export async function findVisibleDeck(
  deckId: string,
  viewerId: string | null
): Promise<VisibleDeck | null> {
  const deck = await readDeckVisibility(deckId);
  if (!deck) return null;
  return decideById(deck, viewerId).allowed ? deck : null;
}

/**
 * Decides how the viewer may see the deck with this id.
 *
 * For callers that read a different shape per view, such as the owner's whole
 * deck against the public allowlist.
 *
 * @param deckId Deck identifier from the route.
 * @param viewerId Signed-in user id, or null for anonymous viewers.
 * @returns The policy's decision, or null when no deck has this id.
 * @throws whatever Prisma throws when the database is unavailable
 */
export async function decideDeckView(
  deckId: string,
  viewerId: string | null
): Promise<DeckViewDecision | null> {
  const deck = await readDeckVisibility(deckId);
  return deck ? decideById(deck, viewerId) : null;
}
