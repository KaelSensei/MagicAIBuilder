"use client";
// TanStack Query hook for Commander Spellbook combo detection
import { useQuery } from "@tanstack/react-query";
import { fetchCombosForDeck } from "@/modules/combos/client/api";
import {
  deckComboQueryKey,
  normalizeDeckComboQuery,
  type DeckComboQuery,
} from "@/modules/combos/domain/deck-query";
import type { Deck } from "@/lib/deck/types";

const STALE_TIME_1H = 60 * 60 * 1000;
const MIN_CARDS = 10;

function toDeckComboQuery(deck: Deck | null): DeckComboQuery {
  if (!deck) return { commanders: [], main: [] };
  return {
    commanders: [deck.commander, deck.partner].flatMap((card) =>
      card ? [card.name] : []
    ),
    main: deck.cards
      .filter((card) => card.zone === "main")
      .map((card) => card.name),
  };
}

/**
 * Returns the combos the active deck can assemble, from one lookup per distinct
 * card list. It runs once the deck holds at least 10 cards. A failed lookup is
 * an error, not an empty list, and is not retried: Spellbook asks for sparse use.
 */
export function useCombos(deck: Deck | null) {
  const query = toDeckComboQuery(deck);
  const enabled = query.commanders.length + query.main.length >= MIN_CARDS;

  return useQuery({
    queryKey: [
      "combos",
      "spellbook",
      deckComboQueryKey(normalizeDeckComboQuery(query)),
    ],
    queryFn: () => fetchCombosForDeck(query),
    enabled,
    staleTime: STALE_TIME_1H,
    retry: false,
  });
}
