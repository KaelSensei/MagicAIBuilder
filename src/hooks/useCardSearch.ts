"use client";
/**
 * The TanStack Query hook behind the builder's card search: one Scryfall
 * search page per query, cached for five minutes.
 *
 * Card catalog context, browser side. `useCardSearchResults` composes it with
 * the "Collection only" filter; the request itself goes through the Scryfall
 * client's queue (`lib/scryfall/client`).
 *
 * @module hooks/useCardSearch
 */
import { useQuery } from "@tanstack/react-query";
import { searchCards } from "@/lib/scryfall/client";
import { STALE_TIME_5MIN } from "@/lib/query/stale-times";

/** Shortest query, once trimmed, that a search hook sends to Scryfall. */
export const MIN_SEARCH_QUERY_LENGTH = 2;

/** Search cards with TanStack Query — 5 min cache */
export function useCardSearch(query: string) {
  return useQuery({
    queryKey: ["scryfall", "search", query],
    queryFn: () => searchCards(query),
    enabled: query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
    staleTime: STALE_TIME_5MIN,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no results)
      if (error instanceof Error && error.message.includes("404")) return false;
      return failureCount < 2;
    },
  });
}
