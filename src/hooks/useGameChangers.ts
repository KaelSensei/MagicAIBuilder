"use client";
// Game Changers detection hook with paginated Scryfall fetch
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { fetchAllPages } from "@/lib/scryfall/client";
import {
  mergeLocalizedPrintings,
  toScryfallLang,
} from "@/lib/scryfall/localized";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { useMemo } from "react";

const STALE_TIME_24H = 24 * 60 * 60 * 1000;

/** Fetches the Game Changers list from Scryfall (all pages) */
export function useGameChangersList() {
  return useQuery({
    queryKey: ["scryfall", "game-changers"],
    queryFn: () => fetchAllPages("is:gamechanger"),
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
  });
}

/**
 * The Game Changers list with printings in the viewer's language where any
 * exist — for display surfaces only.
 *
 * The English list stays the source of truth: a `lang:`-filtered search only
 * returns cards printed in that language, so using it as the list itself would
 * silently drop every Game Changer without a translated printing. The
 * localised query is a second, progressive layer — the page renders English
 * first and re-renders translated when (and if) the layer arrives. Loading and
 * error therefore track the English query alone.
 */
export function useLocalizedGameChangersList() {
  const locale = useLocale();
  const lang = toScryfallLang(locale);
  const english = useGameChangersList();

  const localized = useQuery({
    queryKey: ["scryfall", "game-changers", lang],
    // The flag and the lang: filter must travel together — see searchCards.
    queryFn: () => fetchAllPages(`is:gamechanger lang:${lang}`, true),
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

/** Returns a Set of Game Changer card names and a helper function */
export function useGameChangersSet() {
  const { data } = useGameChangersList();
  const names = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.map((c) => c.name));
  }, [data]);

  const isGameChanger = (cardName: string): boolean => names.has(cardName);

  return { gameChangerNames: names, isGameChanger, isLoaded: !!data };
}

/** Detects Game Changers in the given deck */
export function useGameChangers(deck: Deck | null) {
  const { gameChangerNames } = useGameChangersSet();

  const deckGameChangers = useMemo(() => {
    if (!deck) return [] as DeckCard[];
    const allCards = [
      ...(deck.commander ? [deck.commander] : []),
      ...(deck.partner ? [deck.partner] : []),
      ...deck.cards,
    ];
    return allCards.filter(
      (c) => c.isGameChanger || gameChangerNames.has(c.name)
    );
  }, [deck, gameChangerNames]);

  return {
    gameChangers: deckGameChangers,
    count: deckGameChangers.length,
    names: deckGameChangers.map((c) => c.name),
    isLoading: !gameChangerNames.size,
  };
}
