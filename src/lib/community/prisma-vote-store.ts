/**
 * The `VoteStore` port over the `DeckVote` table.
 *
 * Community context, deck interactions. Implements
 * `deck-interaction-ports.ts` for `deck-vote-use-cases.ts`; wired by
 * `deck-interaction-server.ts`. One vote per user and deck is the table's
 * unique key (`userId_deckId`), which is what makes `saveVote` an upsert and
 * `removeVote` a `deleteMany` that may delete nothing.
 *
 * @module community/prisma-vote-store
 */
import "server-only";
import type { PrismaClient } from "@prisma/client";

import type { VoteStore } from "@/lib/community/deck-interaction-ports";
import type { DeckVote, VoteValue } from "@/lib/community/votes";

/**
 * Reads a stored value as a vote direction.
 *
 * The route's schema only ever stores 1 or -1, and the schema comment says
 * so, but the column is an `Int`. Anything else counts as a downvote, which
 * is how `calculateVoteScore` read the rows before this adapter existed
 * (it tested `value === 1` and treated the rest as down).
 */
function toVoteValue(stored: number): VoteValue {
  return stored === 1 ? 1 : -1;
}

/**
 * The vote store over `client`.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaVoteStore(client: PrismaClient): VoteStore {
  return {
    async listVotes(deckId): Promise<readonly DeckVote[]> {
      const rows = await client.deckVote.findMany({
        where: { deckId },
        select: { userId: true, deckId: true, value: true },
      });
      return rows.map((row) => ({
        userId: row.userId,
        deckId: row.deckId,
        value: toVoteValue(row.value),
      }));
    },

    async saveVote({ userId, deckId, value }) {
      // Upsert so flipping a vote replaces it rather than stacking a second row.
      await client.deckVote.upsert({
        where: { userId_deckId: { userId, deckId } },
        update: { value },
        create: { value, userId, deckId },
      });
    },

    async removeVote({ userId, deckId }) {
      // deleteMany keeps this idempotent when no vote exists.
      await client.deckVote.deleteMany({ where: { userId, deckId } });
    },
  };
}
