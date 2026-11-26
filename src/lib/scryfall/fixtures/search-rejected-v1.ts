/**
 * Scryfall's answer to a search it cannot read, recorded from the live API.
 *
 * Recorded on 2026-11-25 (22:19 UTC) from https://api.scryfall.com:
 * `GET /cards/search?q=xyz:abc&page=1&order=edhrec`, the request `searchCards` sends for a
 * player who typed an unknown keyword. Scryfall answered 400 Bad Request with this body, as
 * `application/json`. Nothing was edited.
 *
 * Scryfall sends every error object "with the appropriate 4XX or 5XX HTTP status code"
 * (https://scryfall.com/docs/api/errors, read 2026-11-25). The app reads a 400 or a 422 as a
 * rejected query (`components/search/search-failure.ts`); a 422 could not be provoked from the
 * search endpoint, so no body is recorded for it.
 *
 * @module scryfall/fixtures/search-rejected-v1
 */
import type { ScryfallError } from "@/lib/scryfall/types";

/** Scryfall's 400 body, which also lists the terms it ignored (`warnings`). */
export const SEARCH_REJECTED_RECORDED: ScryfallError & {
  readonly warnings: readonly string[];
} = {
  object: "error",
  code: "bad_request",
  status: 400,
  warnings: [
    "Invalid expression “xyz:abc” was ignored. Unknown keyword “xyz”.",
  ],
  details: "All of your terms were ignored.",
};

/** The query whose answer `SEARCH_REJECTED_RECORDED` is. */
export const SEARCH_REJECTED_QUERY = "xyz:abc";
