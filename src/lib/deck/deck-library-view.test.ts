import { describe, expect, it } from "vitest";
import { deriveLibraryView, type LibraryViewInput } from "./deck-library-view";

/** A library with no deck, signed in, listing settled, nothing failed. */
function signedInLibrary(
  overrides: Partial<LibraryViewInput<string>> = {}
): LibraryViewInput<string> {
  return {
    sessionStatus: "authenticated",
    sessionTimedOut: false,
    isLoadingDecks: false,
    loadError: null,
    decks: [],
    visibleDecks: [],
    ...overrides,
  };
}

describe("deriveLibraryView: one screen per state", () => {
  it("shows the skeleton while the session is still pending", () => {
    const view = deriveLibraryView(
      signedInLibrary({ sessionStatus: "loading", isLoadingDecks: true })
    );

    expect(view).toEqual({ kind: "loading" });
  });

  it("shows the skeleton while a signed-in player's first listing is in flight", () => {
    const view = deriveLibraryView(signedInLibrary({ isLoadingDecks: true }));

    expect(view).toEqual({ kind: "loading" });
  });

  it("blocks on the session once its request has timed out", () => {
    const view = deriveLibraryView(
      signedInLibrary({ sessionStatus: "loading", sessionTimedOut: true })
    );

    expect(view).toEqual({ kind: "sessionBlocked" });
  });

  it("shows the failure panel with the listing error when no deck loaded", () => {
    const view = deriveLibraryView(
      signedInLibrary({ loadError: "[fetchDecks] HTTP 500" })
    );

    expect(view).toEqual({
      kind: "loadFailed",
      error: "[fetchDecks] HTTP 500",
    });
  });

  it("shows the empty library to a signed-in player with no deck", () => {
    expect(deriveLibraryView(signedInLibrary())).toEqual({ kind: "empty" });
  });

  it("shows the empty library to a signed-out visitor rather than loading forever", () => {
    // Pinned by the page's own test for the signed-out visitor: no session
    // request is pending, so nothing is loading and nothing has failed.
    const view = deriveLibraryView(
      signedInLibrary({
        sessionStatus: "unauthenticated",
        isLoadingDecks: true,
      })
    );

    expect(view).toEqual({ kind: "empty" });
  });

  it("says no deck matches when the filter hides every deck", () => {
    const view = deriveLibraryView(
      signedInLibrary({ decks: ["atraxa", "krenko"], visibleDecks: [] })
    );

    expect(view).toEqual({
      kind: "searchEmpty",
      deckCount: 2,
      refreshFailed: false,
    });
  });

  it("lists the visible decks, counting every deck for the subtitle", () => {
    const view = deriveLibraryView(
      signedInLibrary({ decks: ["atraxa", "krenko"], visibleDecks: ["atraxa"] })
    );

    expect(view).toEqual({
      kind: "ready",
      decks: ["atraxa"],
      deckCount: 2,
      refreshFailed: false,
    });
  });
});

describe("deriveLibraryView: precedence when several conditions hold", () => {
  it("keeps the decks on screen while a retry is in flight instead of showing the skeleton", () => {
    const view = deriveLibraryView(
      signedInLibrary({
        isLoadingDecks: true,
        decks: ["atraxa"],
        visibleDecks: ["atraxa"],
      })
    );

    expect(view.kind).toBe("ready");
  });

  it("keeps the decks on screen with a refresh notice when a reload fails", () => {
    const view = deriveLibraryView(
      signedInLibrary({
        loadError: "[fetchDecks] HTTP 500",
        decks: ["atraxa"],
        visibleDecks: ["atraxa"],
      })
    );

    expect(view).toEqual({
      kind: "ready",
      decks: ["atraxa"],
      deckCount: 1,
      refreshFailed: true,
    });
  });

  it("carries the refresh notice into the no-match screen as well", () => {
    const view = deriveLibraryView(
      signedInLibrary({
        loadError: "[fetchDecks] HTTP 500",
        decks: ["atraxa"],
        visibleDecks: [],
      })
    );

    expect(view).toEqual({
      kind: "searchEmpty",
      deckCount: 1,
      refreshFailed: true,
    });
  });

  it("keeps the decks on screen even after the session request times out", () => {
    const view = deriveLibraryView(
      signedInLibrary({
        sessionStatus: "loading",
        sessionTimedOut: true,
        decks: ["atraxa"],
        visibleDecks: ["atraxa"],
      })
    );

    expect(view.kind).toBe("ready");
  });

  it("hides a previous failure behind the skeleton while the retry is in flight", () => {
    const view = deriveLibraryView(
      signedInLibrary({
        isLoadingDecks: true,
        loadError: "[fetchDecks] HTTP 500",
      })
    );

    expect(view).toEqual({ kind: "loading" });
  });

  it("shows the skeleton, not the failure, while the session is pending with a stale error", () => {
    const view = deriveLibraryView(
      signedInLibrary({ sessionStatus: "loading", loadError: "stale" })
    );

    expect(view).toEqual({ kind: "loading" });
  });

  it("asks for the session first when the session timed out and the listing had failed", () => {
    const view = deriveLibraryView(
      signedInLibrary({
        sessionStatus: "loading",
        sessionTimedOut: true,
        loadError: "[fetchDecks] HTTP 500",
      })
    );

    expect(view).toEqual({ kind: "sessionBlocked" });
  });

  it("never reports a timeout as loading, whatever the session status says", () => {
    const view = deriveLibraryView(
      signedInLibrary({ sessionTimedOut: true, isLoadingDecks: true })
    );

    expect(view).toEqual({ kind: "sessionBlocked" });
  });
});
