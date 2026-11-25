/**
 * What the search panel's result list shows, and what its live region says, for one search outcome.
 *
 * Card catalog context, search panel. `SearchResults` renders every state around one status region
 * that stays mounted, so a screen reader hears "Searching…" and then the count, the empty message
 * or the reason nothing was searched: a live region mounted together with its text is not reliably
 * announced (WAI-ARIA 1.2, "Live Regions", https://www.w3.org/TR/wai-aria-1.2/#live_region_roles,
 * read 2026-11-25). Keeping the precedence here, in one pure function, keeps the layout and the
 * announcement from disagreeing.
 *
 * @module components/search/search-results-view
 */
import type { CollectionOnlyState } from "@/hooks/useCardSearchResults";

/** The states in which "Collection only" had nothing to filter by, so nothing was searched. */
export type CollectionOnlyBlocked = Exclude<
  CollectionOnlyState,
  { readonly kind: "scanned" }
>;

/** Which layout the result list takes. */
export type SearchResultsPhase =
  "searching" | "failed" | "blocked" | "empty" | "listed";

/** A `search` catalog message, with the numbers it formats. */
export interface StatusMessage {
  readonly key: string;
  readonly values?: Readonly<Record<string, number>>;
}

/** The outcome of a search, as `SearchResults` receives it. */
export interface SearchOutcome {
  readonly isLoading: boolean;
  readonly error: Error | null;
  /** The cards listed, after "Collection only" filtered them. */
  readonly cardCount: number;
  /** Every match Scryfall reported, when it reported a total. */
  readonly totalCards?: number;
  readonly collectionOnly?: CollectionOnlyState;
}

/**
 * The layout and the polite status of one search outcome.
 *
 * `status` is `null` when there is nothing polite to say: a failed search speaks through its own
 * alert, and a list without a reported total has no count to give.
 */
export interface SearchResultsView {
  readonly phase: SearchResultsPhase;
  readonly status: StatusMessage | null;
}

function blockedMessageKey(state: CollectionOnlyBlocked): string {
  switch (state.kind) {
    case "signedOut":
      return "collectionOnly.signedOut";
    case "emptyCollection":
      return "collectionOnly.emptyCollection";
    case "collectionUnavailable":
      return "collectionOnly.collectionUnavailable";
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function listedCount(outcome: SearchOutcome): StatusMessage | null {
  if (outcome.collectionOnly) {
    return {
      key: "collectionOnly.ownedCount",
      values: { count: outcome.cardCount },
    };
  }
  if (outcome.totalCards == null) return null;
  return { key: "resultCount", values: { count: outcome.totalCards } };
}

/**
 * Decides, in this order of precedence: searching, the error, a "Collection only" search that had
 * no collection to filter by, no result, or the listed cards with their count.
 *
 * @param outcome - the search as `SearchResults` receives it
 * @returns the layout to render and the message its status region announces
 */
export function searchResultsView(outcome: SearchOutcome): SearchResultsView {
  if (outcome.isLoading) {
    return { phase: "searching", status: { key: "searching" } };
  }
  if (outcome.error) return { phase: "failed", status: null };
  const owned = outcome.collectionOnly;
  if (owned && owned.kind !== "scanned") {
    return { phase: "blocked", status: { key: blockedMessageKey(owned) } };
  }
  if (outcome.cardCount === 0) {
    const key = owned ? "collectionOnly.noMatch" : "noResults";
    return { phase: "empty", status: { key } };
  }
  return { phase: "listed", status: listedCount(outcome) };
}
