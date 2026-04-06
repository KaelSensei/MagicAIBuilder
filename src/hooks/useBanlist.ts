"use client";
// Format-aware banlist hook with paginated Scryfall fetch
import { useQuery } from "@tanstack/react-query";
import { fetchAllPages } from "@/lib/scryfall/client";
import { getFormatConfig } from "@/lib/deck/formats";
import type { DeckFormat } from "@/lib/deck/formats";
import { useMemo } from "react";

const STALE_TIME_24H = 24 * 60 * 60 * 1000;

/** Fetches the banlist for the given format from Scryfall (all pages) */
export function useBanlistQuery(format: DeckFormat = "commander") {
  const legality = getFormatConfig(format).scryfallLegality;
  return useQuery({
    queryKey: ["scryfall", "banlist", format],
    queryFn: () => fetchAllPages(`banned:${legality}`),
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
  });
}

/** Returns a Set of banned card names for the given format */
export function useBanlistSet(format: DeckFormat = "commander") {
  const { data } = useBanlistQuery(format);
  const names = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.map((c) => c.name));
  }, [data]);

  const isBanned = (cardName: string): boolean => names.has(cardName);

  return { bannedNames: names, isBanned, isLoaded: !!data };
}
