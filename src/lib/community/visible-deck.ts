import { prisma } from "@/lib/db/prisma";

/**
 * Deck visibility for the community routes.
 *
 * This function was byte-identical in four route files — comments, comment
 * edit/delete, ratings and votes. Four copies of a visibility rule is four
 * places to forget when the rule changes, and a visibility rule that is wrong
 * in one of them leaks a private deck.
 */

/** A deck the viewer is allowed to see, reduced to what the checks need. */
export interface VisibleDeck {
  readonly id: string;
  readonly userId: string | null;
  readonly isPublic: boolean;
}

/**
 * Loads a deck and confirms the viewer may see it.
 *
 * @param deckId Deck identifier from the route.
 * @param viewerId Signed-in user id, or null for anonymous viewers.
 * @returns The deck when visible, otherwise null.
 */
export async function findVisibleDeck(
  deckId: string,
  viewerId: string | null
): Promise<VisibleDeck | null> {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { id: true, userId: true, isPublic: true },
  });

  if (!deck) return null;

  // Both sides are nullable, and `deck.userId !== viewerId` alone reads
  // null === null as ownership — so a deck with no owner would be visible to
  // every signed-out viewer. The schema permits that row (`userId` is
  // optional) even though no current code path writes one, so this is a latent
  // hole rather than a live leak. Found by a test written as a hypothesis.
  const isOwner = viewerId !== null && deck.userId === viewerId;
  if (!deck.isPublic && !isOwner) return null;

  return deck;
}
