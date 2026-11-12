/**
 * The server's own Scryfall requests, the only source of shared cache entries.
 *
 * Requests go through `httpGet` (timeout, the app's User-Agent and an Accept
 * header, which Scryfall requires) and wait their turn in the runtime's Scryfall
 * queue. A body is returned only after it passes the shape check, so nothing
 * but a Scryfall card or list can reach the cache.
 */
import "server-only";
import { httpGet, HttpStatusError } from "@/lib/http";
import { isScryfallCard, isScryfallSearchResponse } from "./guards";
import { scheduleScryfallRequest } from "./request-queue";
import { SCRYFALL_API } from "./constants";
import type { SearchCacheKey } from "./shared-cache-keys";
import {
  EMPTY_SEARCH_RESPONSE,
  type ScryfallCard,
  type ScryfallSearchResponse,
} from "./types";

/** What Scryfall answered, reduced to what a cache route can act on. */
export type UpstreamResult<T> =
  | { readonly kind: "found"; readonly data: T }
  | { readonly kind: "not_found" }
  | { readonly kind: "failed"; readonly status: number | null };

async function getJson(url: string): Promise<UpstreamResult<unknown>> {
  try {
    const response = await scheduleScryfallRequest(url, () => httpGet(url));
    const data: unknown = await response.json();
    return { kind: "found", data };
  } catch (error) {
    if (!(error instanceof HttpStatusError))
      return { kind: "failed", status: null };
    return error.status === 404
      ? { kind: "not_found" }
      : { kind: "failed", status: error.status };
  }
}

/**
 * @param key - the page to ask for, with the order the client has always used
 * @returns the page; Scryfall's 404 for a valid query with no match is an empty page
 */
export async function fetchSearchPage(
  key: SearchCacheKey
): Promise<UpstreamResult<ScryfallSearchResponse>> {
  const params = new URLSearchParams({
    q: key.query,
    page: String(key.page),
    order: "edhrec",
  });
  if (key.multilingual) params.set("include_multilingual", "true");

  const result = await getJson(`${SCRYFALL_API}/cards/search?${params}`);
  switch (result.kind) {
    case "found":
      return isScryfallSearchResponse(result.data)
        ? { kind: "found", data: result.data }
        : { kind: "failed", status: null };
    case "not_found":
      return { kind: "found", data: EMPTY_SEARCH_RESPONSE };
    case "failed":
      return result;
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

/**
 * @param id - a lower-case Scryfall card id
 * @returns the card, only when Scryfall answered with that same id
 */
export async function fetchCard(
  id: string
): Promise<UpstreamResult<ScryfallCard>> {
  const result = await getJson(`${SCRYFALL_API}/cards/${id}`);
  if (result.kind !== "found") return result;
  return isScryfallCard(result.data) && result.data.id === id
    ? { kind: "found", data: result.data }
    : { kind: "failed", status: null };
}
