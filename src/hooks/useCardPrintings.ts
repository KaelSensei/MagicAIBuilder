"use client";
import { useQuery } from "@tanstack/react-query";
import { searchCardPrintings } from "@/lib/scryfall/client";

export function useCardPrintings(cardName: string | null) {
  const STALE_TIME_24H = 24 * 60 * 60 * 1000;
  return useQuery({
    queryKey: ["scryfall", "printings", cardName],
    queryFn: () => searchCardPrintings(cardName!),
    enabled: !!cardName,
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
    retry: 1,
  });
}
