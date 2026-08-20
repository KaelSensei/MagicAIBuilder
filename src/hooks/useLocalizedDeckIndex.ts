"use client";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { fetchLocalizedPrintingsByNames } from "@/lib/scryfall/client";
import {
  indexLocalizedText,
  toScryfallLang,
  type LocalizedCardText,
} from "@/lib/scryfall/localized";

const STALE_TIME_24H = 24 * 60 * 60 * 1000;
const EMPTY_INDEX: ReadonlyMap<string, LocalizedCardText> = new Map();

/**
 * Display text for a whole list of cards, keyed by English name, in the
 * viewer's language where a printing exists.
 *
 * `DeckCard` rows hold only the English snapshot written at add time, so a
 * deck-wide surface cannot localise itself card by card without one request
 * per row. This hook runs the batch path once for the list: names are sorted
 * into the query key so reordering or regrouping the deck does not refetch,
 * and adding a card refetches the whole (24h-cached) batch rather than
 * diffing — the batch is five requests at most for a 100-card deck.
 *
 * English viewers get an empty map and no request. A card absent from the map
 * has no translated printing; callers fall back to the English name.
 *
 * @param names - English card names, duplicates allowed
 * @returns localised text by English name; empty until the batch arrives
 */
export function useLocalizedDeckIndex(
  names: readonly string[]
): ReadonlyMap<string, LocalizedCardText> {
  const locale = useLocale();
  const lang = toScryfallLang(locale);
  const sortedNames = useMemo(() => [...new Set(names)].sort((a, b) => a.localeCompare(b)), [names]);

  const { data } = useQuery({
    queryKey: ["scryfall", "deck-localized", lang, sortedNames],
    queryFn: () => fetchLocalizedPrintingsByNames(sortedNames, lang),
    enabled: lang !== "en" && sortedNames.length > 0,
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
  });

  return useMemo(() => (data ? indexLocalizedText(data) : EMPTY_INDEX), [data]);
}
