/**
 * The search panel's layout and polite status for one search outcome, and their precedence.
 *
 * Solitary: `searchResultsView` is a pure policy. `SearchResults.test.tsx` renders the states;
 * this file pins which state wins when several apply, which a render cannot show on its own.
 *
 * @module components/search/search-results-view.test
 */
import { describe, expect, it } from "vitest";
import { searchResultsView, type SearchOutcome } from "./search-results-view";

/** A settled search that sent its query and found nothing; each case overrides what it needs. */
function anOutcome(overrides: Partial<SearchOutcome> = {}): SearchOutcome {
  return {
    isLoading: false,
    error: null,
    cardCount: 0,
    waitingFor: null,
    ...overrides,
  };
}

/*
 * By Set and By Color send no search until the player chooses a set or colours, and an empty
 * list alone cannot tell that from a search that found nothing (I-13).
 */
describe("searchResultsView before and after a tab sends its search", () => {
  it("asks for a set while By Set waits for one", () => {
    expect(searchResultsView(anOutcome({ waitingFor: "set" }))).toEqual({
      phase: "idle",
      status: { key: "choose.set" },
    });
  });

  it("asks for colours while By Color waits for them", () => {
    expect(searchResultsView(anOutcome({ waitingFor: "colors" }))).toEqual({
      phase: "idle",
      status: { key: "choose.colors" },
    });
  });

  it("says that nothing was found once a search was sent and came back empty", () => {
    expect(searchResultsView(anOutcome())).toEqual({
      phase: "empty",
      status: { key: "noResults" },
    });
  });

  it("lists the cards once a search was sent and found some", () => {
    expect(
      searchResultsView(anOutcome({ cardCount: 3, totalCards: 3 }))
    ).toEqual({
      phase: "listed",
      status: { key: "resultCount", values: { count: 3 } },
    });
  });
});

describe("searchResultsView precedence: searching, failed, blocked, idle, empty, listed", () => {
  it("shows the search in flight before what the tab waits for", () => {
    const view = searchResultsView(
      anOutcome({ isLoading: true, waitingFor: "set" })
    );

    expect(view.phase).toBe("searching");
  });

  it("shows a failure before what the tab waits for", () => {
    const view = searchResultsView(
      anOutcome({ error: new Error("down"), waitingFor: "colors" })
    );

    expect(view.phase).toBe("failed");
  });

  it("says why Collection only searched nothing before what the tab waits for", () => {
    const view = searchResultsView(
      anOutcome({ collectionOnly: { kind: "signedOut" }, waitingFor: "set" })
    );

    expect(view.phase).toBe("blocked");
  });

  it("asks for the choice even when the list still holds cards", () => {
    const view = searchResultsView(
      anOutcome({ cardCount: 2, totalCards: 2, waitingFor: "set" })
    );

    expect(view.phase).toBe("idle");
  });
});
