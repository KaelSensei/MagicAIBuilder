"use client";
// TanStack Query hook for Commander Spellbook combo detection
import { useQuery } from "@tanstack/react-query";
import { fetchCombosForDeck } from "@/lib/combos/spellbook";
import type { Deck } from "@/lib/deck/types";

const STALE_TIME_1H = 60 * 60 * 1000;
const MIN_CARDS = 10;

/** Returns detected combos for the active deck (triggers when deck ≥ 10 cards) */
export function useCombos(deck: Deck | null) {
  const allCardNames = deck
    ? [
        ...(deck.commander ? [deck.commander.name] : []),
        ...(deck.partner ? [deck.partner.name] : []),
        ...deck.cards.map((c) => c.name),
      ]
    : [];

  const enabled = allCardNames.length >= MIN_CARDS;

  return useQuery({
    queryKey: ["combos", "spellbook", allCardNames.sort().join(",")],
    queryFn: () => fetchCombosForDeck(allCardNames),
    enabled,
    staleTime: STALE_TIME_1H,
    retry: 1,
  });
}
