/**
 * What the builder's search panel offers when its search finds nothing.
 *
 * Card catalog context, builder search panel. A pure policy: the builder page describes the search
 * its panel runs and gets back the one next step `SearchResults` renders (I-13 AC-13-05). The
 * rules follow the query each search builds in `lib/scryfall/search.ts`, so no step offers an
 * action that changes nothing:
 * - the commander, partner and companion pickers read only the colours (`id<=`) of the filters,
 *   and "Collection only";
 * - By Set and By Color read no search filter, and the page turns "Collection only" off there;
 * - only the plain name search sends the player's text as Scryfall syntax; the pickers and
 *   By Color wrap it in `name:/…/`, and By Set has no text box.
 *
 * @module components/builder/empty-search-next-step
 */
import type { EmptySearchNextStep } from "@/components/search/EmptySearchResult";
import { searchFiltersNarrow } from "@/lib/scryfall/search-filters";
import type { SearchFilters } from "@/lib/scryfall/search-types";

/** The search the builder's panel runs. */
export interface BuilderPanelSearch {
  /** The tab: the name search, one set's cards, or the cards of chosen colours. */
  readonly tab: "name" | "set" | "color";
  /** A commander, partner or companion picker is on; its query replaces the tab's. */
  readonly picking: boolean;
  /** A confirmed plain-language query runs as written, without the filters. */
  readonly pinned: boolean;
  /** The filters the panel holds, read or not by the query. */
  readonly filters: SearchFilters;
  /** "Collection only" filters the list, as the page asks `useCardSearchResults` to. */
  readonly collectionOnly: boolean;
}

const NO_NEXT_STEP: EmptySearchNextStep = { kind: "none" };
const SYNTAX_HINT: EmptySearchNextStep = { kind: "syntaxHint" };

/** The pickers' queries read the colours as `id<=` and nothing else of the filters. */
function pickerFiltersNarrow(search: BuilderPanelSearch): boolean {
  return search.collectionOnly || search.filters.colors.length > 0;
}

/** A confirmed plain-language query keeps "Collection only" and drops every other filter. */
function nameFiltersNarrow(search: BuilderPanelSearch): boolean {
  if (search.pinned) return search.collectionOnly;
  return searchFiltersNarrow(search.filters);
}

/** "Clear filters" when `narrow`, else `otherwise`. */
function clearFiltersOr(
  narrow: boolean,
  otherwise: EmptySearchNextStep,
  onClearFilters: () => void
): EmptySearchNextStep {
  return narrow ? { kind: "clearFilters", onClearFilters } : otherwise;
}

/**
 * The one next step an empty result of the builder's search offers.
 *
 * @param search - the search the panel runs
 * @param onClearFilters - resets the panel's filters; carried by a "Clear filters" step
 * @returns "Clear filters" while the filters narrow the query; else the syntax hint in the plain
 *   name search, and nothing in the pickers, By Set and By Color
 */
export function emptySearchNextStep(
  search: BuilderPanelSearch,
  onClearFilters: () => void
): EmptySearchNextStep {
  // The pickers win over the tab, as in the page's `buildSearchQueryFromMode`.
  if (search.picking) {
    return clearFiltersOr(
      pickerFiltersNarrow(search),
      NO_NEXT_STEP,
      onClearFilters
    );
  }
  switch (search.tab) {
    case "name":
      return clearFiltersOr(
        nameFiltersNarrow(search),
        SYNTAX_HINT,
        onClearFilters
      );
    case "set":
    case "color":
      return NO_NEXT_STEP;
    default: {
      const unhandled: never = search.tab;
      return unhandled;
    }
  }
}
