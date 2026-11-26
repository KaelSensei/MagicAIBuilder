/**
 * Which filter sets narrow a name search, so that an empty result offers
 * "Clear filters" only when clearing them changes the search (I-13 AC-13-05).
 *
 * Solitary: a pure policy over the query builder.
 */
import { describe, expect, it } from "vitest";
import type { SearchFilters } from "@/lib/scryfall/search-types";
import { NO_SEARCH_FILTERS, searchFiltersNarrow } from "./search-filters";

/** The empty filter set with the given filters set. */
function filtersWith(overrides: Partial<SearchFilters>): SearchFilters {
  return { ...NO_SEARCH_FILTERS, ...overrides };
}

describe("searchFiltersNarrow", () => {
  it("is false for the empty filter set", () => {
    expect(searchFiltersNarrow(filtersWith({}))).toBe(false);
  });

  it.each<[string, Partial<SearchFilters>]>([
    ["a colour", { colors: ["W"] }],
    ["colorless", { colorlessFilter: true }],
    ["lands", { landFilter: true }],
    ["a card type", { types: ["Creature"] }],
    ["a minimum mana value", { cmcMin: 2 }],
    ["an exact mana value", { cmcMode: "exact", cmcExact: 3 }],
    ["a price ceiling", { priceMax: 5 }],
    ["a subtype", { subtype: "Elf" }],
    ["a keyword", { keyword: "Flying" }],
    ["a minimum power", { powerMin: 4 }],
    ["a role", { interactionType: "removal" }],
    ["Collection only", { collectionOnly: true }],
  ])("is true for %s", (_name, overrides) => {
    expect(searchFiltersNarrow(filtersWith(overrides))).toBe(true);
  });

  it.each<[string, Partial<SearchFilters>]>([
    ["an exact mana value mode left blank", { cmcMode: "exact" }],
    ["the All colour mode with no colour", { colorMode: "and" }],
    ["a blank subtype", { subtype: "   " }],
    ["Collection only turned off", { collectionOnly: false }],
    [
      "a minimum left behind by the Exact mode",
      { cmcMode: "exact", cmcMin: 2 },
    ],
  ])("is false for %s, which adds nothing to the query", (_name, overrides) => {
    expect(searchFiltersNarrow(filtersWith(overrides))).toBe(false);
  });
});
