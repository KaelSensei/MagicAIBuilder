"use client";
// Game Changers detection hook
import { useQuery } from "@tanstack/react-query";
import { searchCards } from "@/lib/scryfall/client";
import type { Deck } from "@/lib/deck/types";
import { useMemo } from "react";

const STALE_TIME_24H = 24 * 60 * 60 * 1000;

/** Fetches the Game Changers list from Scryfall */
export function useGameChangersList() {
  return useQuery({
    queryKey: ["scryfall", "game-changers"],
    queryFn: () => searchCards("is:gamechanger"),
    staleTime: STALE_TIME_24H,
  });
}

/** Returns a Set of Game Changer card names and a helper function */
export function useGameChangersSet() {
  const { data } = useGameChangersList();
  const names = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.data.map((c) => c.name));
  }, [data]);

  const isGameChanger = (cardName: string): boolean => names.has(cardName);

  return { gameChangerNames: names, isGameChanger, isLoaded: !!data };
}

/** Detects Game Changers in the given deck */
export function useGameChangers(deck: Deck | null) {
  const { gameChangerNames } = useGameChangersSet();

  const deckGameChangers = useMemo(() => {
    if (!deck) return [];
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
