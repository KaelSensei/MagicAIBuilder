/**
 * What the Bulk Edit dialog tells a player whose save threw.
 *
 * Deck-building context, Bulk Edit dialog. A save throws for two reasons: the
 * card lookup did not answer (`CardLookupError`), or the deck API did not
 * save the list. The deck client's error reads `[applyCardChanges] HTTP 500:
 * …` and a browser's reads "Failed to fetch": diagnostic text that the
 * dialog logs and never shows (I-01). The player gets a sentence from the
 * `deck` catalog, read from the error's type and status only.
 *
 * `PATCH /api/decks/[id]/cards` sends no code the client could turn into a
 * sentence of its own: it clamps a line past the copy limit instead of
 * refusing it, and its 400 for a command zone that cannot be saved together
 * carries English text only. Both read as any other failure.
 *
 * @module components/deck/bulk-edit-failure
 */
import { isStaleDeckRefusal } from "@/lib/db/deck-api-answer";
import { CardLookupError } from "@/lib/deck/card-lookup-error";
import {
  deckRequestFailureOf,
  type DeckRequestFailure,
} from "@/lib/deck/deck-request-failure";
import { DroppedDeckWriteError } from "@/lib/deck/deck-write-queue";

/** A `deck` catalog key for a Bulk Edit save that threw. */
export type BulkEditFailureMessageKey =
  | "bulkEdit.lookupFailed"
  | "bulkEdit.conflictReloaded"
  | "bulkEdit.signedOut"
  | "bulkEdit.saveFailed";

/**
 * How each deck request failure reads. A 404 (the deck was deleted elsewhere)
 * reads as any other failure: the builder shows "Deck not found" once it
 * reloads, and the dialog has nothing more useful to say.
 */
const SAVE_FAILURE_MESSAGES: Readonly<
  Record<DeckRequestFailure, BulkEditFailureMessageKey>
> = {
  "signed-out": "bulkEdit.signedOut",
  missing: "bulkEdit.saveFailed",
  failed: "bulkEdit.saveFailed",
};

/**
 * Whether the save was not made because the deck changed elsewhere: the
 * server refused it as stale (409), or the queue dropped it behind an earlier
 * write of the deck that was. Either way the store reloads the deck and
 * raises the conflict toast, and the dialog puts the reloaded list in place of
 * the player's text, as `bulkEdit.conflictReloaded` tells them.
 *
 * @param error - what the save threw
 * @returns true for a stale refusal or a write dropped behind one
 */
export function isDeckConflict(error: unknown): boolean {
  return isStaleDeckRefusal(error) || error instanceof DroppedDeckWriteError;
}

/**
 * The message a Bulk Edit save that threw shows.
 *
 * @param error - what the save threw: a `CardLookupError`, a `DeckApiError`,
 *   a `DroppedDeckWriteError`, a network `TypeError`, or anything else
 * @returns `bulkEdit.lookupFailed` when the card lookup did not answer,
 *   `bulkEdit.conflictReloaded` when the deck changed elsewhere,
 *   `bulkEdit.signedOut` for a 401, `bulkEdit.saveFailed` otherwise
 */
export function bulkEditFailureMessageKey(
  error: unknown
): BulkEditFailureMessageKey {
  if (error instanceof CardLookupError) return "bulkEdit.lookupFailed";
  if (isDeckConflict(error)) return "bulkEdit.conflictReloaded";
  return SAVE_FAILURE_MESSAGES[deckRequestFailureOf(error)];
}
