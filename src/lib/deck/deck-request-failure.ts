/**
 * Why a deck request failed, as the player can act on it.
 *
 * `POST /api/decks` refuses an empty deck with a name and a format for one
 * reason the player can fix: no session (401, `requireAuth`). A 400 there means
 * the client sent a malformed request, and a 500 or a network error may pass;
 * the player can only try again, so all of those read the same. The thrown
 * message is diagnostic text ("[createDeck] HTTP 500: …", "Failed to fetch")
 * and never reaches the player (I-01).
 *
 * @module deck/deck-request-failure
 */
import { DeckApiError } from "@/lib/db/deck-api-answer";

/** `signed-out`: the session ended, so signing in again helps. `failed`: anything else. */
export type DeckRequestFailure = "signed-out" | "failed";

/**
 * Reads what a deck request threw.
 *
 * @param error - what the deck store threw; a {@link DeckApiError} carries the HTTP status
 * @returns `signed-out` for a 401 answer, `failed` for anything else
 */
export function deckRequestFailureOf(error: unknown): DeckRequestFailure {
  return error instanceof DeckApiError && error.status === 401
    ? "signed-out"
    : "failed";
}
