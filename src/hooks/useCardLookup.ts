"use client";
// TanStack Query hook for single card lookup
import { useQuery } from "@tanstack/react-query";
import { getCardById, getCardByName } from "@/lib/scryfall/client";

const STALE_TIME_24H = 24 * 60 * 60 * 1000;

/** Look up a card by Scryfall ID — 24h cache */
export function useCardLookup(id: string) {
  return useQuery({
    queryKey: ["scryfall", "card", "id", id],
    queryFn: () => getCardById(id),
    enabled: !!id,
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
  });
}

/** Look up a card by exact name — 24h cache */
export function useCardLookupByName(name: string) {
  return useQuery({
    queryKey: ["scryfall", "card", "name", name],
    queryFn: () => getCardByName(name),
    enabled: name.trim().length >= 2,
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
  });
}
