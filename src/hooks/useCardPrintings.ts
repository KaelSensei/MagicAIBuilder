"use client";
import { useQuery } from "@tanstack/react-query";
import { searchCardPrintings } from "@/lib/scryfall/client";

export function useCardPrintings(cardName: string | null) {
  return useQuery({
    queryKey: ["scryfall", "printings", cardName],
    queryFn: () => searchCardPrintings(cardName!),
    enabled: !!cardName,
    staleTime: 24 * 60 * 60 * 1000, // 24h
    retry: 1,
  });
}
