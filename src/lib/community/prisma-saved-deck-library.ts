/**
 * The `SavedDeckLibraryReader` and `LibraryFolderStore` ports over the
 * `PublicDeckFolder` and `SavedPublicDeck` tables.
 *
 * Community context, saved-deck library. Implements
 * `saved-deck-library-ports.ts` for `saved-deck-library-use-cases.ts`; wired
 * by `saved-deck-library.server.ts`. The queries are the ones the
 * `/api/community/deck-folders` routes ran inline before COM-15, unchanged.
 * Every write filters on `userId` as well as the id, so another user's folder
 * matches no row and reads as missing.
 *
 * @module community/prisma-saved-deck-library
 */
import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  LibraryFolderStore,
  SavedDeckLibraryReader,
} from "@/lib/community/saved-deck-library-ports";

/** The columns of one listed bookmark: the deck's public summary, never its cards. */
const BOOKMARK_SELECT = {
  createdAt: true,
  deck: {
    select: {
      id: true,
      name: true,
      commanderName: true,
      user: { select: { username: true, name: true } },
    },
  },
} as const satisfies Prisma.SavedPublicDeckSelect;

/**
 * The library reader over `client`. Both queries filter on
 * `deck.isPublic`, so a deck made private since it was saved is not listed.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaSavedDeckLibraryReader(
  client: PrismaClient
): SavedDeckLibraryReader {
  return {
    async readLibrary(userId) {
      const [folders, unfiled] = await Promise.all([
        client.publicDeckFolder.findMany({
          where: { userId },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            savedDecks: {
              where: { deck: { isPublic: true } },
              orderBy: { createdAt: "desc" },
              select: BOOKMARK_SELECT,
            },
          },
        }),
        client.savedPublicDeck.findMany({
          where: { userId, folderId: null, deck: { isPublic: true } },
          orderBy: { createdAt: "desc" },
          select: BOOKMARK_SELECT,
        }),
      ]);
      return { folders, unfiled };
    },
  };
}

/**
 * The folder store over `client`.
 *
 * @param client - the Prisma client to run on
 */
export function prismaLibraryFolderStore(
  client: PrismaClient
): LibraryFolderStore {
  return {
    create({ userId, name }) {
      return client.publicDeckFolder.create({
        data: { userId, name },
        select: { id: true, name: true, createdAt: true },
      });
    },

    async rename({ folderId, userId, name }) {
      // updateMany so the owner filter applies; a foreign id updates nothing.
      const result = await client.publicDeckFolder.updateMany({
        where: { id: folderId, userId },
        data: { name },
      });
      return result.count > 0;
    },

    async deleteAndUnfile({ folderId, userId }) {
      // One transaction: the bookmarks are unfiled and the folder deleted
      // together, or neither happens.
      const [, deleted] = await client.$transaction([
        client.savedPublicDeck.updateMany({
          where: { folderId, userId },
          data: { folderId: null },
        }),
        client.publicDeckFolder.deleteMany({ where: { id: folderId, userId } }),
      ]);
      return deleted.count > 0;
    },
  };
}
