/**
 * Bookmarking a public deck: save it into the caller's library, optionally in
 * one of their folders, or remove the bookmark.
 *
 * Community context, saved-deck library. `/api/community/decks/[id]/save`
 * calls these after the session and the body are checked, and maps each
 * outcome to a status; the HTTP concerns stay in the route. The use cases
 * depend on the ports in `deck-action-ports.ts` only, so they run in Vitest
 * with in-memory fakes and no database (ADR 0005). The rule is `canSaveDeck`
 * (`deck-action-rules.ts`). Reading the library and managing its folders is
 * `saved-deck-library-use-cases.ts` (`/api/community/deck-folders`).
 *
 * @module community/saved-deck-use-cases
 */
import type {
  DeckFactsReader,
  DeckFolderReader,
  SavedDeckStore,
} from "@/lib/community/deck-action-ports";
import { canSaveDeck } from "@/lib/community/deck-action-rules";

/** The adapters the saved-deck use cases run on; `deck-action-server.ts` passes the real ones. */
export interface SavedDeckUseCasePorts {
  readonly decks: DeckFactsReader;
  readonly folders: DeckFolderReader;
  readonly savedDecks: SavedDeckStore;
}

/** One bookmark to store; `folderId` null keeps it at the library's root. */
export interface SavePublicDeckCommand {
  readonly deckId: string;
  readonly userId: string;
  readonly folderId: string | null;
}

/** The bookmark to remove; removing one that does not exist is not an error. */
export interface RemoveSavedDeckCommand {
  readonly deckId: string;
  readonly userId: string;
}

/**
 * The outcome of {@link savePublicDeck}:
 * - `saved`: the bookmark is stored in `folderId` (null for the root);
 * - `deck-not-found`: no deck has this id, or the deck is not public (a
 *   private deck answers as a missing one, for its owner too);
 * - `folder-not-found`: the caller owns no folder with this id. Another
 *   user's folder answers the same, so folder ids do not leak.
 */
export type SavePublicDeckResult =
  | { readonly kind: "saved"; readonly folderId: string | null }
  | { readonly kind: "deck-not-found" }
  | { readonly kind: "folder-not-found" };

/**
 * Saves a public deck into the caller's library, moving an earlier bookmark
 * of the same deck to the given folder.
 *
 * The deck is checked before the folder, as the route did, so a private deck
 * is never told apart from a missing one by a folder error. One bookmark per
 * user and deck is the store's guarantee.
 */
export async function savePublicDeck(
  { deckId, userId, folderId }: SavePublicDeckCommand,
  ports: SavedDeckUseCasePorts
): Promise<SavePublicDeckResult> {
  const deck = await ports.decks.readDeckFacts(deckId);
  if (!deck || !canSaveDeck(deck).allowed) return { kind: "deck-not-found" };

  if (folderId !== null && !(await ports.folders.isOwnedBy(folderId, userId))) {
    return { kind: "folder-not-found" };
  }

  await ports.savedDecks.save({ userId, deckId, folderId });
  return { kind: "saved", folderId };
}

/**
 * Removes the caller's bookmark of a deck. Only their own row goes: the deck
 * stays untouched. Idempotent, and it does not read the deck: the route
 * answered 200 whether or not the deck or the bookmark existed.
 */
export async function removeSavedDeck(
  { deckId, userId }: RemoveSavedDeckCommand,
  ports: Pick<SavedDeckUseCasePorts, "savedDecks">
): Promise<void> {
  await ports.savedDecks.remove({ userId, deckId });
}
