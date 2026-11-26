/**
 * Which screen the deck library shows: the one place where the precedence
 * between a pending session, a failed listing, an empty library and an empty
 * search is written.
 *
 * Deck-building context, the library page (`/decks`). Pure: the page hands it
 * the session status, the store's listing outcome and the filtered list, and
 * renders the variant it returns, one branch per {@link LibraryView} kind.
 * Not responsible for the folder filter, the search or the sort
 * (`deck-listing.ts`), nor for deciding when a session request has waited too
 * long (`useBoundedSession`).
 *
 * @module deck/deck-library-view
 */

/** The session status as next-auth's `useSession` reports it. */
export type LibrarySessionStatus =
  "loading" | "authenticated" | "unauthenticated";

/**
 * The facts the library view is derived from.
 *
 * `TDeck` is whatever the page lists; the derivation only counts the decks and
 * hands the visible ones back.
 */
export interface LibraryViewInput<TDeck> {
  readonly sessionStatus: LibrarySessionStatus;
  /** True once the session request has stayed pending past its bound. */
  readonly sessionTimedOut: boolean;
  /**
   * True from the page's mount until the first listing settles, and again
   * while a manual retry is in flight.
   */
  readonly isLoadingDecks: boolean;
  /** The store's last listing error; null when the last listing succeeded. */
  readonly loadError: string | null;
  /** Every deck the store holds. */
  readonly decks: readonly TDeck[];
  /** The decks left after the folder filter, the search and the sort. */
  readonly visibleDecks: readonly TDeck[];
}

/**
 * One variant per screen of the library, carrying what that screen renders.
 *
 * - `loading`: the skeleton cards.
 * - `sessionBlocked`: the session-timeout panel with its retry.
 * - `loadFailed`: the failure panel, a translated message and a reload retry.
 *   It carries no error text: the listing's error is diagnostic English, kept
 *   in the log, never shown to the player (I-04).
 * - `empty`: the "start building" panel.
 * - `searchEmpty`: the "no deck matches" notice; `deckCount` feeds the
 *   subtitle and `refreshFailed` the refresh notice above the list.
 * - `ready`: the deck grid or table over `decks`, with the same two fields.
 */
export type LibraryView<TDeck> =
  | { readonly kind: "loading" }
  | { readonly kind: "sessionBlocked" }
  | { readonly kind: "loadFailed" }
  | { readonly kind: "empty" }
  | {
      readonly kind: "searchEmpty";
      readonly deckCount: number;
      readonly refreshFailed: boolean;
    }
  | {
      readonly kind: "ready";
      readonly decks: readonly TDeck[];
      readonly deckCount: number;
      readonly refreshFailed: boolean;
    };

/**
 * Derives the library's screen from the session, the listing and the filter.
 *
 * Precedence, first match wins:
 *
 * 1. `ready` or `searchEmpty` whenever the store holds at least one deck:
 *    decks already on screen are never replaced by a skeleton, a timeout or a
 *    failure panel. A listing error then becomes `refreshFailed`, the notice
 *    that keeps the stale list visible, instead of `loadFailed`.
 * 2. `loading`: no deck yet, the session has not timed out, and either the
 *    session is still pending or the player is signed in and a listing is in
 *    flight. A retry in flight hides a previous failure until it settles.
 * 3. `sessionBlocked`: no deck and the session request timed out. It wins
 *    over a stale listing error, so the player is asked to retry the session
 *    first, which is what the listing needs anyway.
 * 4. `loadFailed`: no deck and the last listing failed.
 * 5. `empty`: no deck, nothing pending, nothing failed. A signed-out visitor
 *    whose session request did not time out lands here as well; the page
 *    never lists decks without a session, and its tests pin this screen for
 *    that visitor.
 *
 * Within rule 1, `searchEmpty` is returned when `visibleDecks` is empty and
 * `ready` otherwise.
 */
export function deriveLibraryView<TDeck>(
  input: LibraryViewInput<TDeck>
): LibraryView<TDeck> {
  const { decks, visibleDecks, loadError } = input;
  if (decks.length > 0) {
    const refreshFailed = loadError !== null;
    return visibleDecks.length === 0
      ? { kind: "searchEmpty", deckCount: decks.length, refreshFailed }
      : {
          kind: "ready",
          decks: visibleDecks,
          deckCount: decks.length,
          refreshFailed,
        };
  }
  if (isFirstListingPending(input)) return { kind: "loading" };
  if (input.sessionTimedOut) return { kind: "sessionBlocked" };
  if (loadError !== null) return { kind: "loadFailed" };
  return { kind: "empty" };
}

/** Rule 2 of {@link deriveLibraryView}, for a library with no deck yet. */
function isFirstListingPending<TDeck>(input: LibraryViewInput<TDeck>): boolean {
  if (input.sessionTimedOut) return false;
  if (input.sessionStatus === "loading") return true;
  return input.sessionStatus === "authenticated" && input.isLoadingDecks;
}
