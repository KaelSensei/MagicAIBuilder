"use client";
/**
 * The player's decks a card can be sent to from the open deck: every deck the
 * listing returns but the open one, most recently updated first.
 *
 * Deck-building context, client hook. It reads `GET /api/decks` through the
 * deck client, one page at the listing's largest size; a player with more
 * decks than that sees the latest ones and is told so.
 *
 * @module hooks/useOtherDecks
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchDecks, type ApiDeck } from "@/lib/db/deck-api";

/**
 * The most decks one listing answer carries (`DECK_LISTING_MAX_PAGE_SIZE` in
 * `deck-listing-read.ts`, a server module this browser code cannot import).
 */
export const OTHER_DECKS_PAGE_SIZE = 50;

/** A deck the card can be sent to. */
export interface OtherDeckSummary {
  readonly id: string;
  readonly name: string;
}

/** The listing without the open deck, the most recently updated first. */
function otherDecksByLatest(
  decks: readonly ApiDeck[],
  openDeckId: string
): readonly OtherDeckSummary[] {
  return decks
    .filter((deck) => deck.id !== openDeckId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ id, name }) => ({ id, name }));
}

/**
 * Lists the player's other decks.
 *
 * @param openDeckId - the deck open in the editor, left out of the list
 * @returns the decks once read; whether the listing held more than one page;
 *   the load state; and `retry`, which reads the listing again
 */
export function useOtherDecks(openDeckId: string) {
  const query = useQuery({
    queryKey: ["decks", "other-deck-picker"],
    queryFn: () => fetchDecks(0, OTHER_DECKS_PAGE_SIZE),
  });
  const decks = useMemo(
    () => (query.data ? otherDecksByLatest(query.data.decks, openDeckId) : []),
    [query.data, openDeckId]
  );
  return {
    decks,
    isTruncated: (query.data?.total ?? 0) > OTHER_DECKS_PAGE_SIZE,
    isLoading: query.isPending,
    isError: query.isError,
    retry: () => void query.refetch(),
  };
}
