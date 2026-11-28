/**
 * The advanced card search's filter values that set no filter, and whether a
 * filter set narrows a search.
 *
 * Context: Card catalog. The builder page starts its search panel from
 * `NO_SEARCH_FILTERS`, which used to be a private constant of that page, and
 * resets to it from an empty result's "Clear filters" (I-13 AC-13-05).
 *
 * @module lib/scryfall/search-filters
 */
import { buildSearchQuery } from "@/lib/scryfall/search";
import type { SearchFilters } from "@/lib/scryfall/search-types";

/** Every filter off: no colour, type, bound, text or role, "Collection only" off. */
export const NO_SEARCH_FILTERS: Readonly<SearchFilters> = {
  colors: [],
  colorMode: "or",
  colorlessFilter: false,
  landFilter: false,
  types: [],
  cmcMode: "range",
  cmcMin: null,
  cmcMax: null,
  cmcExact: null,
  priceMin: null,
  priceMax: null,
  subtype: "",
  keyword: "",
  powerMin: null,
  powerMax: null,
  toughnessMin: null,
  toughnessMax: null,
  interactionType: null,
};

/** The query the name search sends for no text and no filter. */
const UNFILTERED_QUERY = buildSearchQuery("", NO_SEARCH_FILTERS);

/**
 * Whether these filters narrow a name search: they add a clause to its
 * Scryfall query, or "Collection only" keeps only the cards the player owns.
 *
 * The answer comes from `buildSearchQuery` itself, so it cannot drift from the
 * query: a mode chosen without a value ("Exact" mana value left blank, "All"
 * colours with none picked) or a blank subtype narrows nothing.
 *
 * @param filters - the filters the search panel holds
 * @returns true when clearing them would widen the search
 */
export function searchFiltersNarrow(filters: SearchFilters): boolean {
  return (
    filters.collectionOnly === true ||
    buildSearchQuery("", filters) !== UNFILTERED_QUERY
  );
}
