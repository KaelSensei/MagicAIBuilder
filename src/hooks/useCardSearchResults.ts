"use client";
/**
 * The card list the builder's search panel shows, in the shape `SearchResults` takes.
 *
 * Card catalog context, browser side. With "Collection only" off it is Scryfall's first page
 * (`useCardSearch`). With it on, it is the cards whose Oracle card the player owns in some
 * printing (`collection/owned-oracle-names`), read from Scryfall by `scryfall/search-scan`.
 *
 * Why the filter runs here: Scryfall cannot know a player's collection, and a query fragment
 * naming every owned card does not fit: the shared search cache takes 1,000 characters at most
 * (`MAX_SEARCH_QUERY_LENGTH`), about forty names, and a collection holds hundreds. Searching the
 * collection locally is not possible either: a collection row has no type, colours, mana value or
 * text, and players type Scryfall syntax. So Scryfall evaluates the query and the browser keeps
 * the owned cards, reading more pages only when the first holds too few (see `search-scan.ts`).
 *
 * @module hooks/useCardSearchResults
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MIN_SEARCH_QUERY_LENGTH,
  STALE_TIME_5MIN,
  useCardSearch,
} from "@/hooks/useCardSearch";
import { useInitContext } from "@/components/providers/InitProvider";
import { useCollectionStore } from "@/lib/collection/store";
import {
  isOwnedOracleCard,
  ownedOracleNames,
  type OwnedOracleNames,
} from "@/lib/collection/owned-oracle-names";
import { searchCards } from "@/lib/scryfall/client";
import { pauseFor, scanSearch } from "@/lib/scryfall/search-scan";
import type { ScryfallCard } from "@/lib/scryfall/types";

const NO_CARDS: readonly ScryfallCard[] = [];

/** next-auth's session status, as `useSession().status` reports it. */
export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/** How the panel searches. */
export interface CardSearchOptions {
  /** The "Collection only" filter: list only cards the player owns. */
  readonly collectionOnly: boolean;
  readonly sessionStatus: SessionStatus;
}

/**
 * Why a "Collection only" list holds what it holds.
 *
 * - `signedOut`: a guest has no collection, so nothing was searched.
 * - `emptyCollection`: the player owns no card, so nothing was searched.
 * - `collectionUnavailable`: the collection failed to load, so nothing was searched.
 * - `scanned`: the owned cards among the `scannedCards` first matches of `totalMatches`;
 *   `complete` is false when matches were left unchecked.
 */
export type CollectionOnlyState =
  | { readonly kind: "signedOut" }
  | { readonly kind: "emptyCollection" }
  | { readonly kind: "collectionUnavailable" }
  | {
      readonly kind: "scanned";
      readonly scannedCards: number;
      readonly totalMatches: number;
      readonly complete: boolean;
    };

/** Whether the player's collection can drive the filter yet. */
type CollectionAvailability =
  | "loading"
  | "signedOut"
  | "emptyCollection"
  | "collectionUnavailable"
  | "ready";

/** Where the collection fetch stands, from the sign-in bootstrap and the collection store. */
type CollectionLoad = "loading" | "failed" | "settled";

function collectionAvailability(
  sessionStatus: SessionStatus,
  load: CollectionLoad,
  owned: OwnedOracleNames
): CollectionAvailability {
  if (sessionStatus === "loading") return "loading";
  if (sessionStatus === "unauthenticated") return "signedOut";
  // A refresh, or a failed refresh, of a collection already in hand keeps filtering by the cards
  // already known.
  if (owned.size > 0) return "ready";
  switch (load) {
    case "loading":
      return "loading";
    case "failed":
      return "collectionUnavailable";
    case "settled":
      return "emptyCollection";
    default: {
      const unhandled: never = load;
      return unhandled;
    }
  }
}

/**
 * The collection is fetched by the sign-in bootstrap (`InitProvider`) and reloaded by the
 * collection page (`loadCollection`); either may be under way or have failed.
 */
function useCollectionLoad(): CollectionLoad {
  const { initializationStatus } = useInitContext();
  const storeLoading = useCollectionStore((s) => s.isLoading);
  const storeFailed = useCollectionStore((s) => s.loadError);
  if (initializationStatus === "loading" || storeLoading) return "loading";
  if (initializationStatus === "error" || storeFailed) return "failed";
  return "settled";
}

/** What the search panel renders. */
export interface CardSearchResults {
  /** The cards to list, in Scryfall's order. */
  readonly cards: readonly ScryfallCard[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  /** Scryfall's count of matching cards; absent until Scryfall answers. */
  readonly totalCards?: number;
  /** Set only while "Collection only" filters the list. */
  readonly collectionOnly?: CollectionOnlyState;
}

/** The Oracle cards in the player's collection, recomputed only when the collection changes. */
function useOwnedOracleNames(): OwnedOracleNames {
  const cards = useCollectionStore((s) => s.collectionCards);
  const foilCards = useCollectionStore((s) => s.collectionCardsFoil);
  return useMemo(
    () =>
      ownedOracleNames([...Object.values(cards), ...Object.values(foilCards)]),
    [cards, foilCards]
  );
}

/**
 * Reads the search for "Collection only". The query key leaves the collection out on purpose:
 * the scan keeps every card it read and the owned ones are picked at render, so a change to the
 * collection shows at once without reading Scryfall again.
 */
function useOwnedSearchScan(
  query: string,
  owned: OwnedOracleNames,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["scryfall", "search", "collection-only", query],
    queryFn: ({ signal }) =>
      scanSearch(
        { fetchPage: (page) => searchCards(query, page), pause: pauseFor },
        { isWanted: (card) => isOwnedOracleCard(card, owned), signal }
      ),
    enabled: enabled && query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
    staleTime: STALE_TIME_5MIN,
  });
}

/**
 * Searches Scryfall for the panel, keeping only owned cards when `collectionOnly` is on.
 *
 * Only one of the two searches runs at a time, so turning the filter on sends no request for the
 * unfiltered list.
 *
 * @param query - a full Scryfall query; shorter than 2 characters means no search
 */
export function useCardSearchResults(
  query: string,
  options: CardSearchOptions
): CardSearchResults {
  const { collectionOnly } = options;
  const owned = useOwnedOracleNames();
  const availability = collectionAvailability(
    options.sessionStatus,
    useCollectionLoad(),
    owned
  );
  const search = useCardSearch(collectionOnly ? "" : query);
  const scan = useOwnedSearchScan(
    query,
    owned,
    collectionOnly && availability === "ready"
  );
  const ownedCards = useMemo(
    () =>
      scan.data?.cards.filter((card) => isOwnedOracleCard(card, owned)) ??
      NO_CARDS,
    [scan.data, owned]
  );

  if (!collectionOnly) {
    return {
      cards: search.data?.data ?? NO_CARDS,
      isLoading: search.isLoading,
      error: search.error,
      totalCards: search.data?.total_cards,
    };
  }

  if (availability === "loading") {
    return { cards: NO_CARDS, isLoading: true, error: null };
  }
  if (availability !== "ready") {
    return {
      cards: NO_CARDS,
      isLoading: false,
      error: null,
      collectionOnly: { kind: availability },
    };
  }

  return {
    cards: ownedCards,
    isLoading: scan.isLoading,
    error: scan.error,
    totalCards: scan.data ? ownedCards.length : undefined,
    collectionOnly: scan.data && {
      kind: "scanned",
      scannedCards: scan.data.cards.length,
      totalMatches: scan.data.totalMatches,
      complete: scan.data.complete,
    },
  };
}
