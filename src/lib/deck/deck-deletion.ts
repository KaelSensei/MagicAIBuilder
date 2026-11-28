/**
 * Deleting a deck on the server, where a deck that is already gone counts as
 * deleted.
 *
 * `DELETE /api/decks/:id` answers 404 "Deck not found" when the deck was
 * deleted from another tab or device. What the player asked for is then
 * already true, so the delete succeeds and the deck leaves the library like
 * any deleted deck; the caller can still say it was gone (I-01). Every other
 * failure is the caller's to report.
 *
 * @module deck/deck-deletion
 */
import { deckRequestFailureOf } from "@/lib/deck/deck-request-failure";

/**
 * `deleted`: this request deleted the deck. `alreadyDeleted`: the server had
 * no such deck any more.
 */
export type DeckDeletion = "deleted" | "alreadyDeleted";

/**
 * Sends a deck's delete request and reads a 404 answer as a deck already
 * deleted.
 *
 * @param request - the delete request; rejects with a `DeckApiError` carrying
 *   the HTTP status when the server refuses
 * @returns how the deck left the server
 * @throws what `request` threw, for every failure but a 404
 */
export async function deleteOnServer(
  request: () => Promise<void>
): Promise<DeckDeletion> {
  try {
    await request();
    return "deleted";
  } catch (error) {
    if (deckRequestFailureOf(error) === "missing") return "alreadyDeleted";
    throw error;
  }
}
