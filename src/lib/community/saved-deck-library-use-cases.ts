/**
 * The saved-deck library: read it, and create, rename or delete the personal
 * folders that organise its bookmarks.
 *
 * Community context, saved-deck library. `/api/community/deck-folders` and
 * `.../[folderId]` call these after the session and the body are checked,
 * and map each outcome to a status; the HTTP concerns stay in the routes.
 * The use cases depend on the ports in `saved-deck-library-ports.ts` only, so
 * they run in Vitest with in-memory fakes and no database (ADR 0005). Filing
 * one bookmark is `saved-deck-use-cases.ts`.
 *
 * @module community/saved-deck-library-use-cases
 */
import type {
  CreatedLibraryFolder,
  LibraryFolderDraft,
  LibraryFolderRename,
  LibraryFolderStore,
  OwnerOfFolder,
  SavedDeckLibrary,
  SavedDeckLibraryReader,
} from "@/lib/community/saved-deck-library-ports";

/** The adapters the library use cases run on; `saved-deck-library.server.ts` passes the real ones. */
export interface SavedDeckLibraryPorts {
  readonly library: SavedDeckLibraryReader;
  readonly folders: LibraryFolderStore;
}

/**
 * The outcome of {@link renameLibraryFolder}:
 * - `renamed`: the folder now has `name`;
 * - `folder-not-found`: the caller owns no folder with this id. Another
 *   user's folder answers the same, so folder ids do not leak.
 */
export type RenameLibraryFolderResult =
  | { readonly kind: "renamed"; readonly id: string; readonly name: string }
  | { readonly kind: "folder-not-found" };

/**
 * The outcome of {@link deleteLibraryFolder}:
 * - `deleted`: the folder is gone and its bookmarks are unfiled;
 * - `folder-not-found`: the caller owns no folder with this id; nothing
 *   changed, another user's bookmarks included.
 */
export type DeleteLibraryFolderResult =
  { readonly kind: "deleted" } | { readonly kind: "folder-not-found" };

/**
 * Reads the caller's library: their folders by name with the bookmarks filed
 * in each, and the unfiled bookmarks, newest first. Decks made private since
 * they were saved are left out (the reader's guarantee).
 */
export function readSavedDeckLibrary(
  userId: string,
  ports: Pick<SavedDeckLibraryPorts, "library">
): Promise<SavedDeckLibrary> {
  return ports.library.readLibrary(userId);
}

/**
 * Creates an empty folder in the caller's library.
 *
 * The name arrives trimmed and checked by the route. A second folder of the
 * same name rejects with the store's error, which the route answers 500.
 */
export function createLibraryFolder(
  draft: LibraryFolderDraft,
  ports: Pick<SavedDeckLibraryPorts, "folders">
): Promise<CreatedLibraryFolder> {
  return ports.folders.create(draft);
}

/** Renames one of the caller's folders; see {@link RenameLibraryFolderResult}. */
export async function renameLibraryFolder(
  rename: LibraryFolderRename,
  ports: Pick<SavedDeckLibraryPorts, "folders">
): Promise<RenameLibraryFolderResult> {
  const renamed = await ports.folders.rename(rename);
  if (!renamed) return { kind: "folder-not-found" };
  return { kind: "renamed", id: rename.folderId, name: rename.name };
}

/**
 * Deletes one of the caller's folders. Its bookmarks stay in the library,
 * unfiled: deleting a folder never deletes a saved deck.
 */
export async function deleteLibraryFolder(
  folder: OwnerOfFolder,
  ports: Pick<SavedDeckLibraryPorts, "folders">
): Promise<DeleteLibraryFolderResult> {
  const deleted = await ports.folders.deleteAndUnfile(folder);
  return deleted ? { kind: "deleted" } : { kind: "folder-not-found" };
}
