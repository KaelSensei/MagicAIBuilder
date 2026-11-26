/**
 * Which failed card searches are worth sending to Scryfall again.
 *
 * Card catalog context, browser side. The builder's search (`hooks/useCardSearch`) and its
 * "Collection only" scan (`hooks/useCardSearchResults`) hand `retrySearchFailure` to TanStack
 * Query, so both retry the same failures. The rule reads the status the Scryfall client attached
 * (`ScryfallApiError`), never the error's text, as `components/search/search-failure.ts` does
 * for the message the player reads.
 *
 * Why it matters: Scryfall asks every application to keep its requests low, limits a client
 * that overloads it for 30 seconds and may ban one that keeps doing so
 * (https://scryfall.com/docs/api/rate-limits, "Rate Limits", read 2026-11-25). A query Scryfall
 * rejected gets the same answer every time, so sending it again only costs the player about
 * three seconds of TanStack Query's backoff before the rejected-query message, and costs
 * Scryfall two requests.
 * Not responsible for: the wait between attempts (TanStack Query's default backoff), or
 * honouring a 429's `Retry-After`.
 *
 * @module scryfall/search-retry
 */
import { ScryfallApiError } from "./api-error";

/** Most times one search is sent again after it failed: three attempts in all. */
export const MAX_SEARCH_RETRIES = 2;

/** 429 Too Many Requests: Scryfall's rate limit, which lifts with time. */
const TOO_MANY_REQUESTS = 429;

/** A 4xx status: Scryfall refused the request itself, so the same request gets the same answer. */
function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Whether a failed search can pass if it is sent again.
 *
 * - A `ScryfallApiError` with a 4xx status, 429 excepted, cannot: Scryfall refused the query
 *   (400, 422) or found nothing (404, which `searchCards` already turns into an empty page).
 * - A 429, a 5xx, a network failure (`fetch`'s `TypeError`), a timeout or any other error can:
 *   it says nothing about the query.
 *
 * @param error - whatever the search threw
 * @returns false only for a status that the same request would get again
 */
export function isRetryableSearchFailure(error: unknown): boolean {
  if (!(error instanceof ScryfallApiError)) return true;
  return error.status === TOO_MANY_REQUESTS || !isClientError(error.status);
}

/**
 * TanStack Query's `retry` option for a Scryfall search: send the search again, at most
 * `MAX_SEARCH_RETRIES` times, only when the failure can pass.
 *
 * `error` is typed `Error`, TanStack Query's default error type, because a hook infers its
 * error type from this option: `unknown` here would widen the hook's `error` to `unknown`.
 *
 * @param failureCount - the retries already made for this fetch, from 0
 * @param error - what the last attempt threw
 * @returns whether TanStack Query should send the search again
 */
export function retrySearchFailure(
  failureCount: number,
  error: Error
): boolean {
  return failureCount < MAX_SEARCH_RETRIES && isRetryableSearchFailure(error);
}
