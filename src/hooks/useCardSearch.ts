"use client";
// TanStack Query hook for Scryfall card search
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { searchCards, autocompleteCardName } from "@/lib/scryfall/client";
import type { ScryfallSearchResponse } from "@/lib/scryfall/types";

const STALE_TIME_5MIN = 5 * 60 * 1000;

/** Search cards with TanStack Query — 5 min cache */
export function useCardSearch(query: string) {
  return useQuery({
    queryKey: ["scryfall", "search", query],
    queryFn: () => searchCards(query),
    enabled: query.trim().length >= 2,
    staleTime: STALE_TIME_5MIN,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no results)
      if (error instanceof Error && error.message.includes("404")) return false;
      return failureCount < 2;
    },
  });
}

/** Infinite paginated card search */
export function useCardSearchInfinite(query: string) {
  return useInfiniteQuery<ScryfallSearchResponse>({
    queryKey: ["scryfall", "search", "infinite", query],
    queryFn: ({ pageParam }) =>
      searchCards(query, pageParam as number),
    enabled: query.trim().length >= 2,
    staleTime: STALE_TIME_5MIN,
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages) => {
      if (!lastPage.has_more) return undefined;
      // Extract page number from next_page URL
      if (lastPage.next_page) {
        const url = new URL(lastPage.next_page);
        return parseInt(url.searchParams.get("page") ?? "2", 10);
      }
      return undefined;
    },
  });
}

/** Autocomplete card names */
export function useCardAutocomplete(partial: string) {
  return useQuery({
    queryKey: ["scryfall", "autocomplete", partial],
    queryFn: () => autocompleteCardName(partial),
    enabled: partial.trim().length >= 2,
    staleTime: STALE_TIME_5MIN,
  });
}
