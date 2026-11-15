/**
 * The `DeckFactsReader` port over the `Deck` table: one primary-key read of
 * the visibility columns.
 *
 * Community context, deck actions. Implements `deck-action-ports.ts` for the
 * report and saved-deck use cases; wired by `deck-action-server.ts`. It reads
 * the same columns as `visible-deck.ts` (COM-11), minus the id the callers
 * already hold, and maps the row to `DeckVisibilityFacts` so the rules never
 * see a Prisma row.
 *
 * @module community/prisma-deck-facts-reader
 */
import "server-only";
import type { PrismaClient } from "@prisma/client";

import type { DeckFactsReader } from "@/lib/community/deck-action-ports";

/**
 * The deck facts reader over `client`.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaDeckFactsReader(client: PrismaClient): DeckFactsReader {
  return {
    async readDeckFacts(deckId) {
      const deck = await client.deck.findUnique({
        where: { id: deckId },
        select: { userId: true, isPublic: true, shareEnabled: true },
      });
      if (!deck) return null;
      return {
        ownerId: deck.userId,
        isPublic: deck.isPublic,
        shareEnabled: deck.shareEnabled,
      };
    },
  };
}
