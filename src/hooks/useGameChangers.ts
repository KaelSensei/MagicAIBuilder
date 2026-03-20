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

/** Detects Game Changers in the given deck */
export function useGameChangers(deck: Deck | null) {
  const { data: gameChangersData } = useGameChangersList();

  const gameChangerNames = useMemo(() => {
    if (!gameChangersData) return new Set<string>();
    return new Set(gameChangersData.data.map((c) => c.name));
  }, [gameChangersData]);

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
    isLoading: !gameChangersData,
  };
}
