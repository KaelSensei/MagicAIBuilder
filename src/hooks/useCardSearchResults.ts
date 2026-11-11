"use client";
/**
 * The card list the builder's search panel shows, in the shape `SearchResults` takes.
 *
 * Card catalog context, browser side. It wraps the Scryfall search hook (`useCardSearch`) so the
 * builder page reads one value whatever produced the list.
 *
 * @module hooks/useCardSearchResults
 */
import { useCardSearch } from "@/hooks/useCardSearch";
import type { ScryfallCard } from "@/lib/scryfall/types";

const NO_CARDS: readonly ScryfallCard[] = [];

/** What the search panel renders. */
export interface CardSearchResults {
  /** The cards to list, in Scryfall's order. */
  readonly cards: readonly ScryfallCard[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  /** Scryfall's count of matching cards; absent until Scryfall answers. */
  readonly totalCards?: number;
}

/**
 * Searches Scryfall for the panel.
 *
 * @param query - a full Scryfall query; shorter than 2 characters means no search
 */
export function useCardSearchResults(query: string): CardSearchResults {
  const search = useCardSearch(query);
  return {
    cards: search.data?.data ?? NO_CARDS,
    isLoading: search.isLoading,
    error: search.error,
    totalCards: search.data?.total_cards,
  };
}
