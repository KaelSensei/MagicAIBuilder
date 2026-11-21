/**
 * The library card filter's pure helpers: the query string it sends, and the
 * decks the library lists in each state of the search.
 */
import { describe, expect, it } from "vitest";
import { parseDeckSearchQuery } from "@/lib/community/deck-search-query";
import { aDeck } from "@/test/builders/deck";
import {
  cardFilterQueryString,
  librarySourceDecks,
  withCardName,
} from "./library-card-filter";

describe("cardFilterQueryString", () => {
  it("writes I-75's keys, and reads back as the same filter", () => {
    const query = cardFilterQueryString({
      all: ["Sol Ring", "Kenrith, the Returned King"],
      none: ["Black Lotus"],
    });

    expect(query).toBe(
      "card=Kenrith%2C+the+Returned+King&card=Sol+Ring&no-card=Black+Lotus"
    );
    expect(parseDeckSearchQuery(new URLSearchParams(query)).cards).toEqual({
      all: ["Kenrith, the Returned King", "Sol Ring"],
      any: [],
      none: ["Black Lotus"],
    });
  });
});

describe("withCardName", () => {
  it("leaves the list as it is for a blank name", () => {
    const names = ["Sol Ring"];

    expect(withCardName(names, "   ")).toBe(names);
  });
});

describe("librarySourceDecks", () => {
  const loaded = [
    aDeck({ id: "a", name: "Loaded A", folderId: "moved" }),
    aDeck({ id: "b", name: "Loaded B" }),
  ];

  it("keeps the loaded page while the search is off, pending or failed", () => {
    expect(librarySourceDecks(loaded, { kind: "off" })).toBe(loaded);
    expect(librarySourceDecks(loaded, { kind: "searching" })).toBe(loaded);
    expect(
      librarySourceDecks(loaded, { kind: "failed", retry: () => undefined })
    ).toBe(loaded);
  });

  it("lists the found decks, taking the store's copy of a deck it holds", () => {
    const found = [
      aDeck({ id: "a", name: "Searched A", folderId: null }),
      aDeck({ id: "z", name: "Beyond the page" }),
    ];

    const listed = librarySourceDecks(loaded, {
      kind: "found",
      decks: found,
      hasMore: false,
    });

    expect(listed.map((deck) => [deck.name, deck.folderId ?? null])).toEqual([
      ["Loaded A", "moved"],
      ["Beyond the page", null],
    ]);
  });
});
