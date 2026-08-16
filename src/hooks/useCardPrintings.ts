"use client";
import { useQuery } from "@tanstack/react-query";
import { searchCardPrintings } from "@/lib/scryfall/client";
import type { ScryfallSearchResponse } from "@/lib/scryfall/types";

/**
 * Printings of a card, in the viewer's language where any exist.
 *
 * Most cards are printed in far fewer languages than they are played in, so a
 * localised search comes with an English fallback. Scryfall answers a search
 * with no matches by **404-ing** rather than returning an empty list, so the
 * miss arrives as a thrown error and has to be caught, not tested for.
 *
 * @param cardName - exact English card name, or null to skip the query
 * @param lang - Scryfall language code; "en" skips the localised attempt
 */
export function useCardPrintings(cardName: string | null, lang = "en") {
  const STALE_TIME_24H = 24 * 60 * 60 * 1000;

  return useQuery({
    // lang is part of the key: the same card in two languages is two results.
    queryKey: ["scryfall", "printings", cardName, lang],
    queryFn: async (): Promise<ScryfallSearchResponse> => {
      if (lang !== "en") {
        try {
          const localized = await searchCardPrintings(cardName!, lang);
          if (localized.data.length > 0) return localized;
        } catch {
          // No printing in this language — fall through to English.
        }
      }
      return searchCardPrintings(cardName!);
    },
    enabled: !!cardName,
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
    retry: 1,
  });
}
