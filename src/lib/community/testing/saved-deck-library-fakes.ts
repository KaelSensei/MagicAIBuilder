/**
 * An in-memory saved-deck library for the library use-case tests (ADR 0005:
 * owned ports get a hand-written fake).
 *
 * Community context, saved-deck library. One object plays both ports of
 * `saved-deck-library-ports.ts` over the same rows, so a test can delete a
 * folder and then read the library to see its bookmarks unfiled. It keeps the
 * guarantees the ports state: every change scoped to the folder's owner, only
 * public decks listed, folders by name and bookmarks newest first.
 *
 * @module community/testing/saved-deck-library-fakes
 */
import type {
  LibraryBookmark,
  LibraryFolderStore,
  SavedDeckLibraryReader,
} from "@/lib/community/saved-deck-library-ports";

/** The creation time the fake stamps on every folder it creates. */
export const FAKE_FOLDER_CREATED_AT = new Date("2026-11-19T00:00:00.000Z");

/** A stored folder as the fake keeps it. */
export interface FakeLibraryFolder {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
}

/** A stored bookmark as the fake keeps it: whose, where it is filed, and whether its deck is still public. */
export interface FakeLibraryBookmark extends LibraryBookmark {
  readonly userId: string;
  readonly folderId: string | null;
  readonly deckIsPublic: boolean;
}

/** The library fake, with its rows exposed for seeding and assertions. */
export interface InMemorySavedDeckLibrary
  extends SavedDeckLibraryReader, LibraryFolderStore {
  readonly folders: Map<string, FakeLibraryFolder>;
  readonly bookmarks: FakeLibraryBookmark[];
}

const byName = (a: FakeLibraryFolder, b: FakeLibraryFolder): number =>
  a.name.localeCompare(b.name);

const newestFirst = (a: LibraryBookmark, b: LibraryBookmark): number =>
  b.createdAt.getTime() - a.createdAt.getTime();

/** The bookmark as the reader answers it, without the fake's bookkeeping fields. */
const listed = ({ createdAt, deck }: FakeLibraryBookmark): LibraryBookmark => ({
  createdAt,
  deck,
});

/** @returns a new library holding the seeded rows, independent of every other */
export function inMemorySavedDeckLibrary(
  seed: {
    readonly folders?: readonly FakeLibraryFolder[];
    readonly bookmarks?: readonly FakeLibraryBookmark[];
  } = {}
): InMemorySavedDeckLibrary {
  const folders = new Map(
    (seed.folders ?? []).map((folder) => [folder.id, folder])
  );
  const bookmarks = [...(seed.bookmarks ?? [])];
  const ownedBy = (folderId: string, userId: string) =>
    folders.get(folderId)?.userId === userId;
  const listedIn = (userId: string, folderId: string | null) =>
    bookmarks
      .filter(
        (bookmark) =>
          bookmark.userId === userId &&
          bookmark.folderId === folderId &&
          bookmark.deckIsPublic
      )
      .sort(newestFirst)
      .map(listed);

  return {
    folders,
    bookmarks,
    readLibrary: (userId) =>
      Promise.resolve({
        folders: [...folders.values()]
          .filter((folder) => folder.userId === userId)
          .sort(byName)
          .map(({ id, name }) => ({
            id,
            name,
            savedDecks: listedIn(userId, id),
          })),
        unfiled: listedIn(userId, null),
      }),
    create: ({ userId, name }) => {
      const id = `folder-${folders.size + 1}`;
      folders.set(id, { id, userId, name });
      return Promise.resolve({ id, name, createdAt: FAKE_FOLDER_CREATED_AT });
    },
    rename: ({ folderId, userId, name }) => {
      if (!ownedBy(folderId, userId)) return Promise.resolve(false);
      folders.set(folderId, { id: folderId, userId, name });
      return Promise.resolve(true);
    },
    deleteAndUnfile: ({ folderId, userId }) => {
      if (!ownedBy(folderId, userId)) return Promise.resolve(false);
      bookmarks.forEach((bookmark, index) => {
        if (bookmark.folderId === folderId && bookmark.userId === userId) {
          bookmarks[index] = { ...bookmark, folderId: null };
        }
      });
      folders.delete(folderId);
      return Promise.resolve(true);
    },
  };
}
