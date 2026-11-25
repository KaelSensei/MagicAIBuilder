/**
 * Why the builder could not open a deck, and whether a retry can help.
 *
 * The server answers 404 for a deck it does not have (deleted, never saved, or another
 * player's), and asking again gets the same answer, so the builder says "Deck not found" and
 * offers the way back to the decks. Any other failure (a 5xx, a timeout, no network) may pass,
 * so it keeps "Something went wrong" with a retry (I-01).
 *
 * @module deck/deck-open-error
 */
import { DeckApiError } from "@/lib/db/deck-api-answer";

/** A deck the builder failed to open, scoped to that deck's id. */
export interface DeckOpenError {
  readonly deckId: string;
  /** `not-found`: the server does not have the deck. `failed`: any other failure. */
  readonly kind: "not-found" | "failed";
  /** The failure's message, as the client threw it. */
  readonly reason: string;
}

/**
 * Reads what opening a deck threw.
 *
 * @param deckId - the deck the builder tried to open
 * @param error - what the deck client threw; a {@link DeckApiError} carries the HTTP status
 * @returns `not-found` for a 404 answer, `failed` for anything else
 */
export function deckOpenErrorFrom(
  deckId: string,
  error: unknown
): DeckOpenError {
  return {
    deckId,
    kind: isNotFound(error) ? "not-found" : "failed",
    reason: error instanceof Error ? error.message : "Failed to open deck",
  };
}

/**
 * The failure the builder shows with a retry, or `null` when there is none to retry.
 *
 * A failure to open the deck wins over a failure of the deck listing, as the deck is what the
 * page shows. A deck the server does not have has nothing to retry, so the page falls back to
 * "Deck not found".
 *
 * @param openError - the open failure of the deck on screen, or `null`
 * @param listError - why the deck listing failed, or `null`
 */
export function failureToRetry(
  openError: DeckOpenError | null,
  listError: string | null
): string | null {
  if (!openError) return listError;
  return openError.kind === "failed" ? openError.reason : null;
}

function isNotFound(error: unknown): boolean {
  return error instanceof DeckApiError && error.status === 404;
}
