/**
 * The `RatingStore` port over the `DeckRating` table.
 *
 * Community context, deck interactions. Implements
 * `deck-interaction-ports.ts` for `deck-rating-use-cases.ts`; wired by
 * `deck-interaction-server.ts`. One rating per user and deck is the table's
 * unique key (`userId_deckId`), which is what makes `saveRating` an upsert
 * and `removeRating` a `deleteMany` that may delete nothing.
 *
 * @module community/prisma-rating-store
 */
import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  RatingStore,
  StoredRating,
} from "@/lib/community/deck-interaction-ports";

/** The row the route returns and summarizes: the rating plus its author's display fields. */
const RATING_SELECT = {
  id: true,
  userId: true,
  deckId: true,
  rating: true,
  title: true,
  body: true,
  helpfulCount: true,
  createdAt: true,
  user: { select: { name: true, username: true, image: true } },
} as const satisfies Prisma.DeckRatingSelect;

/**
 * The rating store over `client`.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaRatingStore(client: PrismaClient): RatingStore {
  return {
    listRatings(deckId): Promise<readonly StoredRating[]> {
      return client.deckRating.findMany({
        where: { deckId },
        orderBy: { createdAt: "desc" },
        select: RATING_SELECT,
      });
    },

    saveRating({ userId, deckId, rating, title, body }): Promise<StoredRating> {
      const values = { rating, title, body };
      return client.deckRating.upsert({
        where: { userId_deckId: { userId, deckId } },
        update: values,
        create: { ...values, userId, deckId },
        select: RATING_SELECT,
      });
    },

    async removeRating({ userId, deckId }) {
      // deleteMany keeps this idempotent when no rating exists.
      const { count } = await client.deckRating.deleteMany({
        where: { userId, deckId },
      });
      return count;
    },
  };
}
