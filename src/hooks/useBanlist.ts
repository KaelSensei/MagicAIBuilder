"use client";
// Commander banlist hook with paginated Scryfall fetch
import { useQuery } from "@tanstack/react-query";
import { searchCards } from "@/lib/scryfall/client";
import type { ScryfallSearchResponse } from "@/lib/scryfall/types";
import { useMemo } from "react";

const STALE_TIME_24H = 24 * 60 * 60 * 1000;

/** Fetch all pages of a Scryfall search query */
async function fetchAllPages(query: string): Promise<ScryfallSearchResponse["data"]> {
  const allCards: ScryfallSearchResponse["data"] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await searchCards(query, page);
    allCards.push(...response.data);
    hasMore = response.has_more ?? false;
    page++;
    if (page > 20) break;
  }

  return allCards;
}

/** Fetches the commander banlist from Scryfall (all pages) */
export function useBanlistQuery() {
  return useQuery({
    queryKey: ["scryfall", "banlist"],
    queryFn: () => fetchAllPages("banned:commander"),
    staleTime: STALE_TIME_24H,
  });
}

/** Returns a Set of banned card names and a helper function */
export function useBanlistSet() {
  const { data } = useBanlistQuery();
  const names = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.map((c) => c.name));
  }, [data]);

  const isBanned = (cardName: string): boolean => names.has(cardName);

  return { bannedNames: names, isBanned, isLoaded: !!data };
}
