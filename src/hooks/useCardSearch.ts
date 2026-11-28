"use client";
/**
 * The TanStack Query hook behind the builder's card search: one Scryfall
 * search page per query, cached for five minutes.
 *
 * Card catalog context, browser side. `useCardSearchResults` composes it with
 * the "Collection only" filter; the request itself goes through the Scryfall
 * client's queue (`lib/scryfall/client`). A failed search is sent again only
 * when the failure can pass (`lib/scryfall/search-retry`).
 *
 * @module hooks/useCardSearch
 */
import { useQuery } from "@tanstack/react-query";
import { searchCards } from "@/lib/scryfall/client";
import { retrySearchFailure } from "@/lib/scryfall/search-retry";
import { STALE_TIME_5MIN } from "@/lib/query/stale-times";

/** Shortest query, once trimmed, that a search hook sends to Scryfall. */
export const MIN_SEARCH_QUERY_LENGTH = 2;

/**
 * Searches cards with TanStack Query, cached for five minutes. A search
 * Scryfall rejected fails at once; an outage, a 429 or a network failure is
 * sent again up to twice.
 */
export function useCardSearch(query: string) {
  return useQuery({
    queryKey: ["scryfall", "search", query],
    queryFn: () => searchCards(query),
    enabled: query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
    staleTime: STALE_TIME_5MIN,
    retry: retrySearchFailure,
  });
}
