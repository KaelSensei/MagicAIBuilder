/**
 * The advanced card search's filter values that set no filter.
 *
 * Context: Card catalog. The builder page starts its search panel from
 * `NO_SEARCH_FILTERS`, which used to be a private constant of that page.
 *
 * @module lib/scryfall/search-filters
 */
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
