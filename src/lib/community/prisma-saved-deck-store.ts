/**
 * The `SavedDeckStore` and `DeckFolderReader` ports over the
 * `SavedPublicDeck` and `PublicDeckFolder` tables.
 *
 * Community context, saved-deck library. Implements `deck-action-ports.ts`
 * for `saved-deck-use-cases.ts`; wired by `deck-action-server.ts`. One
 * bookmark per user and deck is the table's unique key (`userId_deckId`),
 * which is what makes `save` an upsert and `remove` a `deleteMany` that may
 * delete nothing. The listing and the folder writes are
 * `prisma-saved-deck-library.ts`.
 *
 * @module community/prisma-saved-deck-store
 */
import "server-only";
import type { PrismaClient } from "@prisma/client";

import type {
  DeckFolderReader,
  SavedDeckStore,
} from "@/lib/community/deck-action-ports";

/**
 * The bookmark store over `client`.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaSavedDeckStore(client: PrismaClient): SavedDeckStore {
  return {
    async save({ userId, deckId, folderId }) {
      // Upsert so saving twice moves the bookmark rather than stacking a second row.
      await client.savedPublicDeck.upsert({
        where: { userId_deckId: { userId, deckId } },
        update: { folderId },
        create: { userId, deckId, folderId },
      });
    },

    async remove({ userId, deckId }) {
      // deleteMany keeps this idempotent when no bookmark exists.
      await client.savedPublicDeck.deleteMany({ where: { userId, deckId } });
    },
  };
}

/**
 * The folder reader over `client`: a folder is owned by the user its row
 * names, nobody else.
 *
 * @param client - the Prisma client to run on
 */
export function prismaDeckFolderReader(client: PrismaClient): DeckFolderReader {
  return {
    async isOwnedBy(folderId, userId) {
      const folder = await client.publicDeckFolder.findFirst({
        where: { id: folderId, userId },
        select: { id: true },
      });
      return folder !== null;
    },
  };
}
