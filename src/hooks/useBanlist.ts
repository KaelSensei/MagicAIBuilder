"use client";
// Commander banlist hook with paginated Scryfall fetch
import { useQuery } from "@tanstack/react-query";
import { fetchAllPages } from "@/lib/scryfall/client";
import { useMemo } from "react";

const STALE_TIME_24H = 24 * 60 * 60 * 1000;

/** Fetches the commander banlist from Scryfall (all pages) */
export function useBanlistQuery() {
  return useQuery({
    queryKey: ["scryfall", "banlist"],
    queryFn: () => fetchAllPages("banned:commander"),
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
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
