/**
 * What the builder's search panel offers when its search finds nothing: "Clear filters" only where
 * the filters narrow the query, the syntax hint only where the player types Scryfall syntax
 * (I-13 AC-13-05).
 *
 * Solitary: a pure policy. `page.search-query.test.tsx` renders the same rules through the page.
 */
import { describe, expect, it } from "vitest";
import { NO_SEARCH_FILTERS } from "@/lib/scryfall/search-filters";
import type { SearchFilters } from "@/lib/scryfall/search-types";
import {
  emptySearchNextStep,
  type BuilderPanelSearch,
} from "./empty-search-next-step";

const clearFilters = (): void => undefined;

/** The plain name search with no filter set; each case overrides what it needs. */
function searchWith(
  overrides: Partial<BuilderPanelSearch>
): BuilderPanelSearch {
  return {
    tab: "name",
    picking: false,
    pinned: false,
    filters: NO_SEARCH_FILTERS,
    collectionOnly: false,
    ...overrides,
  };
}

/** The empty filter set with the given filters set. */
function filtersWith(overrides: Partial<SearchFilters>): SearchFilters {
  return { ...NO_SEARCH_FILTERS, ...overrides };
}

/** The kind of step the policy picks for `search`. */
function stepFor(search: BuilderPanelSearch): string {
  return emptySearchNextStep(search, clearFilters).kind;
}

describe("emptySearchNextStep in the plain name search", () => {
  it("offers Clear filters, with the page's action, while a filter narrows the query", () => {
    const step = emptySearchNextStep(
      searchWith({ filters: filtersWith({ landFilter: true }) }),
      clearFilters
    );

    expect(step).toEqual({
      kind: "clearFilters",
      onClearFilters: clearFilters,
    });
  });

  it("suggests the syntax when no filter narrows the query", () => {
    expect(stepFor(searchWith({}))).toBe("syntaxHint");
  });

  it("suggests the syntax under a confirmed plain-language query, which runs without the filters", () => {
    const search = searchWith({
      pinned: true,
      filters: filtersWith({ colors: ["W"] }),
    });

    expect(stepFor(search)).toBe("syntaxHint");
  });

  it("offers Clear filters under a confirmed plain-language query while Collection only filters it", () => {
    const search = searchWith({
      pinned: true,
      filters: filtersWith({ collectionOnly: true }),
      collectionOnly: true,
    });

    expect(stepFor(search)).toBe("clearFilters");
  });
});

describe("emptySearchNextStep in a commander, partner or companion picker", () => {
  it("offers Clear filters while a colour narrows the picker's query", () => {
    const search = searchWith({
      picking: true,
      filters: filtersWith({ colors: ["W"] }),
    });

    expect(stepFor(search)).toBe("clearFilters");
  });

  it("offers Clear filters while Collection only filters the picker's list", () => {
    const search = searchWith({
      picking: true,
      filters: filtersWith({ collectionOnly: true }),
      collectionOnly: true,
    });

    expect(stepFor(search)).toBe("clearFilters");
  });

  it.each<[string, Partial<SearchFilters>]>([
    ["lands", { landFilter: true }],
    ["colorless", { colorlessFilter: true }],
    ["a card type", { types: ["Creature"] }],
    ["a mana value", { cmcMin: 2 }],
    ["a keyword", { keyword: "Flying" }],
  ])(
    "offers nothing when only %s is set, which the picker's query ignores",
    (_name, overrides) => {
      const search = searchWith({
        picking: true,
        filters: filtersWith(overrides),
      });

      expect(stepFor(search)).toBe("none");
    }
  );

  it("never suggests the syntax, even with no filter set", () => {
    expect(stepFor(searchWith({ picking: true }))).toBe("none");
  });

  it("follows the picker's query on the set tab, where the picker still runs", () => {
    const search = searchWith({
      tab: "set",
      picking: true,
      filters: filtersWith({ colors: ["W"] }),
    });

    expect(stepFor(search)).toBe("clearFilters");
  });
});

describe("emptySearchNextStep on By Set and By Color", () => {
  it.each<[BuilderPanelSearch["tab"]]>([["set"], ["color"]])(
    "offers nothing on the %s tab, whose query reads no search filter",
    (tab) => {
      const search = searchWith({
        tab,
        filters: filtersWith({ colors: ["W"], landFilter: true }),
      });

      expect(stepFor(search)).toBe("none");
    }
  );
});
