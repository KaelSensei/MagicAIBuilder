"use client";
// Format-aware banlist hook with paginated Scryfall fetch
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { fetchAllPages } from "@/lib/scryfall/client";
import {
  mergeLocalizedPrintings,
  toScryfallLang,
} from "@/lib/scryfall/localized";
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

/**
 * The banlist with printings in the viewer's language where any exist —
 * for display surfaces only. Same construction as
 * useLocalizedGameChangersList: the English list stays the source of truth
 * for membership, order and count (a `lang:` search only returns cards
 * printed in that language), and the localised query is a progressive layer.
 */
export function useLocalizedBanlistQuery(format: DeckFormat = "commander") {
  const locale = useLocale();
  const lang = toScryfallLang(locale);
  const legality = getFormatConfig(format).scryfallLegality;
  const english = useBanlistQuery(format);

  const localized = useQuery({
    queryKey: ["scryfall", "banlist", format, lang],
    // The flag and the lang: filter must travel together — see searchCards.
    queryFn: () => fetchAllPages(`banned:${legality} lang:${lang}`, true),
    enabled: lang !== "en",
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
  });

  const data = useMemo(() => {
    if (!english.data) return undefined;
    if (lang === "en" || !localized.data) return english.data;
    return mergeLocalizedPrintings(english.data, localized.data);
  }, [english.data, localized.data, lang]);

  return { data, isLoading: english.isLoading, isError: english.isError };
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
