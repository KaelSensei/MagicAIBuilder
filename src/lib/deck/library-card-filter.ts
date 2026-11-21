/**
 * The card filter of the deck library page (`/decks`): the names the player
 * typed, the query string that asks the server for the matching decks, and
 * the decks the library lists while a search is off, pending, failed or found
 * (I-01, the library filter line of
 * `docs/product/specs/i01-deck-editor-workflow.md`).
 *
 * Deck-building context, pure and browser-safe. The query string is I-75's
 * deck search contract (`lib/community/deck-search-query.ts`), so the library
 * and the public search name a card the same way.
 * Not responsible for: deciding which decks run a card (the server does,
 * `deck-card-filter.ts`), fetching, or the folder filter, name search and
 * sort that apply after it (`deck-listing.ts`).
 *
 * @module deck/library-card-filter
 */
import {
  DECK_SEARCH_LIMITS,
  parseDeckSearchQuery,
  serializeDeckSearchQuery,
} from "@/lib/community/deck-search-query";
import {
  cardFilterNames,
  type DeckCardFilter,
} from "@/lib/deck/deck-card-filter";
import type { Deck } from "@/lib/deck/types";
import { compareCodeUnits } from "@/lib/text/code-unit-order";

/** The filter of a library with no card named. */
export const NO_CARD_FILTER: DeckCardFilter = { all: [], none: [] };

/**
 * Where the card search of the library stands.
 *
 * - `off`: no card named; the library lists the decks it loaded.
 * - `searching`: the first answer for this filter has not come back.
 * - `failed`: the search failed; `retry` asks again.
 * - `found`: the owner's decks that pass, and whether more passed than came.
 */
export type LibraryCardSearch =
  | { readonly kind: "off" }
  | { readonly kind: "searching" }
  | { readonly kind: "failed"; readonly retry: () => void }
  | {
      readonly kind: "found";
      readonly decks: readonly Deck[];
      readonly hasMore: boolean;
    };

/**
 * @param filter - the library's card filter
 * @returns true when at least one card is included or excluded
 */
export function hasCardFilter(filter: DeckCardFilter): boolean {
  return cardFilterNames(filter).length > 0;
}

/**
 * Adds a typed name to one list of the filter. The name is trimmed and its
 * inner spaces collapsed, as the query contract reads it. A blank name, a
 * name already in the list in any case, or a full list leaves it unchanged.
 *
 * @param names - one list of the filter (`all` or `none`)
 * @param typed - the text the player typed
 * @returns the list with the name at its end, or `names` itself
 */
export function withCardName(
  names: readonly string[],
  typed: string
): readonly string[] {
  const name = typed.trim().replaceAll(/\s+/g, " ");
  if (name.length === 0) return names;
  if (names.length >= DECK_SEARCH_LIMITS.cardsPerList) return names;
  const lower = name.toLowerCase();
  if (names.some((listed) => listed.toLowerCase() === lower)) return names;
  return [...names, name];
}

/**
 * @param names - one list of the filter
 * @returns true when the list holds as many names as one search accepts
 */
export function isCardListFull(names: readonly string[]): boolean {
  return names.length >= DECK_SEARCH_LIMITS.cardsPerList;
}

/**
 * The query string of `GET /api/decks/search`, in I-75's canonical form:
 * `card=` for each included name, `no-card=` for each excluded one, each list
 * in code-unit order as `parseDeckSearchQuery` keeps it.
 *
 * @param filter - a filter naming at least one card
 * @returns the query string, without the leading `?`
 */
export function cardFilterQueryString(filter: DeckCardFilter): string {
  const unfiltered = parseDeckSearchQuery(new URLSearchParams());
  return serializeDeckSearchQuery({
    ...unfiltered,
    cards: {
      all: [...filter.all].sort(compareCodeUnits),
      any: [],
      none: [...filter.none].sort(compareCodeUnits),
    },
  });
}

/**
 * The decks the library filters, searches and sorts next. A found search
 * replaces the loaded page, so a deck beyond it shows; a deck the store also
 * holds is taken from the store, whose copy follows a folder move or a
 * fuller load. Any other state keeps the loaded page on screen.
 *
 * @param loaded - the decks the store holds
 * @param search - the card search's state
 * @returns the decks to list
 */
export function librarySourceDecks(
  loaded: readonly Deck[],
  search: LibraryCardSearch
): readonly Deck[] {
  if (search.kind !== "found") return loaded;
  const loadedById = new Map(loaded.map((deck) => [deck.id, deck]));
  return search.decks.map((deck) => loadedById.get(deck.id) ?? deck);
}
