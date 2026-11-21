"use client";
/**
 * Reads the signed-in player's decks that run, or leave out, the cards of the
 * library's filter from `GET /api/decks/search` (I-01), and owns the query
 * key TanStack Query caches them under.
 *
 * Deck-building context, browser side. The deck store is not touched: the
 * library lists the searched decks in place of its loaded page while a card
 * is named (`librarySourceDecks`).
 *
 * @module hooks/useLibraryCardSearch
 */
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import type { ApiDeck } from "@/lib/db/deck-api";
import type { DeckCardFilter } from "@/lib/deck/deck-card-filter";
import {
  cardFilterQueryString,
  hasCardFilter,
  type LibraryCardSearch,
} from "@/lib/deck/library-card-filter";
import { apiDeckToStoreDeck } from "@/lib/deck/store-factories";
import type { Deck } from "@/lib/deck/types";

/**
 * How long one filter's answer is reused. Short: the player may edit a deck
 * in another tab, and `refresh` covers the edits made from the library.
 */
const SEARCH_STALE_MS = 30_000;

/** The root of every card search's key, so `refresh` drops them all. */
const KEY_ROOT = "deck-library-card-search";

/** The route's answer, as `GET /api/decks/search` sends it. */
interface DeckCardSearchAnswer {
  readonly decks: readonly ApiDeck[];
  readonly hasMore: boolean;
}

/** What the library reads from the search. */
export interface LibraryCardSearchState {
  readonly search: LibraryCardSearch;
  /** Drops every cached answer, so the next render asks again; after a delete. */
  readonly refresh: () => void;
}

/**
 * The TanStack Query key of one filter's answer.
 *
 * @param filter - the library's card filter
 */
export function libraryCardSearchKey(filter: DeckCardFilter) {
  return [KEY_ROOT, filter.all, filter.none] as const;
}

/** Asks the route; any non-2xx answer is an error, its body is not shown. */
async function fetchDecksWithCards(
  filter: DeckCardFilter
): Promise<{ readonly decks: readonly Deck[]; readonly hasMore: boolean }> {
  const response = await fetch(
    `/api/decks/search?${cardFilterQueryString(filter)}`
  );
  if (!response.ok) {
    throw new Error(`Deck card search failed (${response.status})`);
  }
  const answer: DeckCardSearchAnswer = await response.json();
  return {
    decks: answer.decks.map(apiDeckToStoreDeck),
    hasMore: answer.hasMore,
  };
}

/**
 * The library's card search. Nothing is asked while the filter names no
 * card. While a changed filter's answer loads, the previous answer stays.
 *
 * @param filter - the included and excluded names
 * @returns the search's state and a way to drop cached answers
 */
export function useLibraryCardSearch(
  filter: DeckCardFilter
): LibraryCardSearchState {
  const active = hasCardFilter(filter);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: libraryCardSearchKey(filter),
    queryFn: () => fetchDecksWithCards(filter),
    enabled: active,
    placeholderData: keepPreviousData,
    staleTime: SEARCH_STALE_MS,
    retry: false,
  });
  const { refetch } = query;
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [KEY_ROOT] });
  }, [queryClient]);
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return { search: searchState(active, query, retry), refresh };
}

/** The search's state from the query's. */
function searchState(
  active: boolean,
  query: {
    readonly isError: boolean;
    readonly data:
      | { readonly decks: readonly Deck[]; readonly hasMore: boolean }
      | undefined;
  },
  retry: () => void
): LibraryCardSearch {
  if (!active) return { kind: "off" };
  if (query.isError) return { kind: "failed", retry };
  if (query.data === undefined) return { kind: "searching" };
  return {
    kind: "found",
    decks: query.data.decks,
    hasMore: query.data.hasMore,
  };
}
