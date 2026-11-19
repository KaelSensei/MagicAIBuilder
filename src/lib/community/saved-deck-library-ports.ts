/**
 * What the saved-deck library needs from storage: the library as the caller
 * reads it, and the caller's personal folders that organise their bookmarks.
 *
 * Community context, saved-deck library. The use cases in
 * `saved-deck-library-use-cases.ts` depend on these ports only.
 * `prisma-saved-deck-library.ts` implements them over Prisma and
 * `saved-deck-library.server.ts` wires them; tests hand the use cases the
 * in-memory fakes of `testing/saved-deck-library-fakes.ts` instead (ADR 0005).
 * Saving and removing one bookmark is `deck-action-ports.ts`'s
 * `SavedDeckStore`.
 *
 * A library folder is not a deck folder: it holds bookmarks of other players'
 * public decks (`PublicDeckFolder`), while a deck folder holds one's own decks
 * (`DeckFolder`, `/api/deck-folders`).
 *
 * @module community/saved-deck-library-ports
 */

/** The author of a saved deck, as the library shows them. */
export interface SavedDeckAuthor {
  readonly username: string | null;
  readonly name: string | null;
}

/**
 * One bookmark as the library lists it: when it was saved, and the deck it
 * points at. `user` is null for a deck with no owner row (`Deck.userId` is
 * optional in the schema).
 */
export interface LibraryBookmark {
  readonly createdAt: Date;
  readonly deck: {
    readonly id: string;
    readonly name: string;
    readonly commanderName: string | null;
    readonly user: SavedDeckAuthor | null;
  };
}

/** One of the caller's folders with the bookmarks filed in it. */
export interface LibraryFolderWithBookmarks {
  readonly id: string;
  readonly name: string;
  readonly savedDecks: readonly LibraryBookmark[];
}

/**
 * The caller's whole library: the folders, and the bookmarks filed in none.
 * The wire twin the browser reads is `SavedDeckFoldersResponse`
 * (`deck-folders.ts`), with `createdAt` as an ISO string.
 */
export interface SavedDeckLibrary {
  readonly folders: readonly LibraryFolderWithBookmarks[];
  readonly unfiled: readonly LibraryBookmark[];
}

/**
 * Reads one user's library.
 *
 * An implementation guarantees:
 * - only the user's own folders and bookmarks, folders sorted by name;
 * - only bookmarks of decks that are still public, so a deck its owner made
 *   private since it was saved never leaks through the library;
 * - bookmarks newest first, inside each folder and among the unfiled ones.
 * It rejects with the store's own error when the store fails.
 */
export interface SavedDeckLibraryReader {
  readLibrary(userId: string): Promise<SavedDeckLibrary>;
}

/** A folder to create: its owner and its name, already trimmed and checked. */
export interface LibraryFolderDraft {
  readonly userId: string;
  readonly name: string;
}

/** The folder a create stored, as the route answers it. */
export interface CreatedLibraryFolder {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
}

/** One user's folder, the pair that scopes every change to its owner. */
export interface OwnerOfFolder {
  readonly folderId: string;
  readonly userId: string;
}

/** A rename of one user's folder. */
export interface LibraryFolderRename extends OwnerOfFolder {
  readonly name: string;
}

/**
 * The stored library folders (`PublicDeckFolder`), each owned by one user.
 *
 * Every change is scoped to the owner, so another user's folder behaves as a
 * missing one. An implementation guarantees:
 * - `create` stores a new folder and answers it;
 * - `rename` renames the owner's folder and answers true, or answers false
 *   when the owner has no folder with this id;
 * - `deleteAndUnfile` moves the owner's bookmarks out of the folder and
 *   deletes it in one transaction, answering whether a folder was deleted;
 *   the bookmarks are kept, unfiled.
 * Any method rejects with the store's own error when the store fails, for
 * example on a second folder of the same name (`@@unique([userId, name])`).
 */
export interface LibraryFolderStore {
  create(draft: LibraryFolderDraft): Promise<CreatedLibraryFolder>;
  rename(rename: LibraryFolderRename): Promise<boolean>;
  deleteAndUnfile(folder: OwnerOfFolder): Promise<boolean>;
}
