/**
 * What the search panel tells a player whose card search failed.
 *
 * Card catalog context, search panel. A failed search used to show the thrown
 * message, so a French player read "Scryfall API error 503: Service
 * Unavailable" or "Failed to fetch". The player gets a sentence from the
 * `search` catalog instead; the raw error is logged where the search fails
 * (`lib/scryfall/client.ts`). Scryfall's own explanation of a rejected query
 * is English from a third party, so it stays in the log.
 *
 * @module components/search/search-failure
 */
import { ScryfallApiError } from "@/lib/scryfall/api-error";

/** A `search` catalog key for a failed search. */
export type SearchFailureMessageKey =
  "failure.unavailable" | "failure.rejectedQuery";

/**
 * The statuses that mean Scryfall refused the query itself (400 Bad Request,
 * 422 Unprocessable Entity), so editing the search can help. Every other
 * failure, a 429, a 5xx or a network error, is an outage the player can only
 * wait out. A 404 never gets here: the client turns it into an empty page.
 */
const REJECTED_QUERY_STATUSES: ReadonlySet<number> = new Set([400, 422]);

/**
 * The message a failed search shows, read from the HTTP status the Scryfall
 * client attached, never from the error's text.
 *
 * @param error - what the search threw: a `ScryfallApiError`, a network
 *   `TypeError`, or anything else
 * @returns `failure.rejectedQuery` when Scryfall rejected the query,
 *   `failure.unavailable` otherwise
 */
export function searchFailureMessageKey(
  error: unknown
): SearchFailureMessageKey {
  if (
    error instanceof ScryfallApiError &&
    REJECTED_QUERY_STATUSES.has(error.status)
  ) {
    return "failure.rejectedQuery";
  }
  return "failure.unavailable";
}
