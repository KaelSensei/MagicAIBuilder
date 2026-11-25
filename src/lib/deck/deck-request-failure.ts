/**
 * Why a deck request failed, as the player can act on it.
 *
 * Two refusals tell the player something they can act on:
 * - 401 (`requireAuth`): the session ended, so signing in again helps. Every
 *   deck route answers it.
 * - 404: the deck is gone, deleted from another tab or device, so trying again
 *   cannot help. `POST /api/decks/:id/duplicate` answers it
 *   (`requireDeckOwner`, then its own read); `POST /api/decks` never does.
 *
 * Anything else reads the same, because the player can only try again: a 400
 * means the client sent a malformed request; a 403 means the deck belongs to
 * another account, which a page that lists and opens only the player's own
 * decks shows only after a sign-in as someone else in another tab; a 500 or a
 * network error may pass. The thrown message is diagnostic text
 * ("[createDeck] HTTP 500: …", "Failed to fetch") and never reaches the
 * player (I-01).
 *
 * @module deck/deck-request-failure
 */
import { DeckApiError } from "@/lib/db/deck-api-answer";

/**
 * `signed-out`: the session ended, so signing in again helps. `missing`: the
 * deck no longer exists. `failed`: anything else.
 */
export type DeckRequestFailure = "signed-out" | "missing" | "failed";

/** The outcome of each status the player can act on; any other status is `failed`. */
const FAILURE_BY_STATUS: ReadonlyMap<number, DeckRequestFailure> = new Map([
  [401, "signed-out"],
  [404, "missing"],
]);

/**
 * Reads what a deck request threw.
 *
 * @param error - what the deck store threw; a {@link DeckApiError} carries the HTTP status
 * @returns `signed-out` for a 401 answer, `missing` for a 404 answer, `failed`
 *   for anything else
 */
export function deckRequestFailureOf(error: unknown): DeckRequestFailure {
  if (!(error instanceof DeckApiError)) return "failed";
  return FAILURE_BY_STATUS.get(error.status) ?? "failed";
}
