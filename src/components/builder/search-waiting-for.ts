/**
 * What the builder's search panel waits for the player to choose before its tab sends a search.
 *
 * Card catalog context, builder search panel. A pure policy: the page gives the tab on screen and
 * the query it built, and gets back the choice `SearchResults` asks for, so By Set and By Color
 * say what to choose instead of "No cards found" while nothing was searched (I-13). The query
 * decides, not the tab's own fields: it already holds a commander, partner or companion pick,
 * which replaces the tab's query, and the search hooks send it by one length rule.
 *
 * @module components/builder/search-waiting-for
 */
import type { BuilderPanelSearch } from "@/components/builder/empty-search-next-step";
import type { SearchChoice } from "@/components/search/search-results-view";
import { MIN_SEARCH_QUERY_LENGTH } from "@/hooks/useCardSearch";

/**
 * The choice the panel waits for, or `null` once the query is sent.
 *
 * @param tab - the search tab on screen
 * @param query - the Scryfall query the page built for the panel, a pick's or a confirmed
 *   description's included
 * @returns a set on By Set and colours on By Color while their query is too short for the search
 *   hooks to send (`MIN_SEARCH_QUERY_LENGTH`); `null` otherwise. The name search always sends its
 *   format's `legal:` clause (`buildSearchQuery`), so it never waits.
 */
export function searchWaitingFor(
  tab: BuilderPanelSearch["tab"],
  query: string
): SearchChoice | null {
  if (query.trim().length >= MIN_SEARCH_QUERY_LENGTH) return null;
  switch (tab) {
    case "set":
      return "set";
    case "color":
      return "colors";
    case "name":
      return null;
    default: {
      const unhandled: never = tab;
      return unhandled;
    }
  }
}
