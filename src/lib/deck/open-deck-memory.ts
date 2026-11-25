/**
 * Which deck the signed-in player has open, remembered in this browser so that
 * a full page load opens it again (I-37, issue #1851).
 *
 * The store held the open deck's id in memory only, so a reload forgot it and
 * every feature that adds to "the open deck" from another page (the Game
 * Changers page, the header's deck actions) had no deck until the player
 * opened one again.
 *
 * Only the deck id is kept, beside the account it belongs to: another account
 * signing in on the same browser never gets it, and signing out forgets it.
 * Browser storage is reached through a getter, and every read and write is
 * wrapped, because a blocked storage (private mode, a storage policy, a full
 * quota) throws, and the open deck is a convenience that must never break the
 * app. The sort and group preference (`./sort`) is kept the same way.
 *
 * @module lib/deck/open-deck-memory
 */
import { DeckApiError } from "@/lib/db/deck-api-answer";
import type { Deck } from "./types";
import { isGuestDeckId } from "./guest-deck";

/** The browser storage key of the remembered open deck. */
export const OPEN_DECK_STORAGE_KEY = "magic-ai-builder:open-deck:v1";

/** The part of the Web Storage API the memory uses. */
export type OpenDeckStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

/** The one record kept: whose open deck, and which deck. */
interface RememberedOpenDeck {
  readonly accountId: string;
  readonly deckId: string;
}

/** Remembers the open deck of the signed-in account. */
export interface OpenDeckMemory {
  /**
   * Takes the account now signed in, and says which deck to open again.
   *
   * Signed out (null), the remembered deck is forgotten. Signed in with a deck
   * already open (a deck id in the URL), that deck wins and is remembered
   * instead. Otherwise the deck this account had open is returned; one kept
   * for another account is forgotten, never returned.
   *
   * @param accountId - the signed-in account, or null when signed out
   * @param openDeckId - the deck open right now, or null
   * @returns the deck to open again, or null when there is none
   */
  readonly follow: (
    accountId: string | null,
    openDeckId: string | null
  ) => string | null;
  /**
   * Records the open deck for the signed-in account; null forgets it. Called
   * on every store change, so a repeated id writes nothing. Nothing is
   * written before an account is known, and the browser-only guest deck is
   * never recorded.
   *
   * @param deckId - the deck open now, or null when none is
   */
  readonly remember: (deckId: string | null) => void;
  /**
   * Forgets `deckId` if it is still the deck remembered, so a deck opened
   * meanwhile stays remembered.
   *
   * @param deckId - a remembered deck that no longer opens
   */
  readonly forget: (deckId: string) => void;
}

/** The record's shape, checked without a cast. */
function isRememberedOpenDeck(value: unknown): value is RememberedOpenDeck {
  return (
    typeof value === "object" &&
    value !== null &&
    "accountId" in value &&
    typeof value.accountId === "string" &&
    "deckId" in value &&
    typeof value.deckId === "string"
  );
}

/**
 * Runs a storage access, and answers `fallback` when the storage is missing
 * or throws.
 */
function safely<T>(
  storage: () => OpenDeckStorage | null,
  access: (store: OpenDeckStorage) => T,
  fallback: T
): T {
  try {
    const store = storage();
    return store ? access(store) : fallback;
  } catch {
    return fallback;
  }
}

/** The record in storage, or null when there is none or it is malformed. */
function readRecord(store: OpenDeckStorage): RememberedOpenDeck | null {
  const raw = store.getItem(OPEN_DECK_STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRememberedOpenDeck(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Creates the open-deck memory over a browser storage.
 *
 * @param storage - returns the storage to use, or null where there is none
 *   (on the server); it may throw, as `window.localStorage` does when blocked
 * @returns the memory, with no account known yet
 */
export function createOpenDeckMemory(
  storage: () => OpenDeckStorage | null
): OpenDeckMemory {
  let accountId: string | null = null;
  let lastSeenDeckId: string | null = null;

  const write = (record: RememberedOpenDeck | null): void => {
    safely(
      storage,
      (store) =>
        record
          ? store.setItem(OPEN_DECK_STORAGE_KEY, JSON.stringify(record))
          : store.removeItem(OPEN_DECK_STORAGE_KEY),
      undefined
    );
  };

  const remember = (deckId: string | null): void => {
    if (accountId === null || deckId === lastSeenDeckId) return;
    lastSeenDeckId = deckId;
    if (deckId !== null && isGuestDeckId(deckId)) return;
    write(deckId === null ? null : { accountId, deckId });
  };

  return {
    follow: (signedIn, openDeckId) => {
      accountId = signedIn;
      lastSeenDeckId = null;
      if (signedIn === null) {
        write(null);
        return null;
      }
      if (openDeckId !== null) {
        remember(openDeckId);
        return null;
      }
      const record = safely(storage, readRecord, null);
      if (record?.accountId === signedIn) return record.deckId;
      if (record) write(null);
      return null;
    },
    remember,
    forget: (deckId) => {
      const record = safely(storage, readRecord, null);
      if (record?.deckId === deckId) write(null);
    },
  };
}

/**
 * The browser's local storage, or null on the server. Reading the property
 * itself throws where storage is blocked; `createOpenDeckMemory` catches it.
 */
export function browserStorage(): OpenDeckStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/**
 * Whether a remembered deck failed to open because it is gone for this
 * player: deleted (404) or not theirs (403). Such a deck is forgotten. Any
 * other failure (offline, a server error) leaves it remembered for the next
 * page load.
 *
 * @param error - what opening the remembered deck threw
 */
export function noLongerOpens(error: unknown): boolean {
  return (
    error instanceof DeckApiError &&
    (error.status === 404 || error.status === 403)
  );
}

/** The part of the deck store a reopened deck changes. */
interface OpenDeckState {
  readonly activeDeckId: string | null;
  readonly decks: Readonly<Record<string, Deck>>;
}

/**
 * Opens a remembered deck that has just loaded, unless a deck was opened
 * while it loaded: a deck id in the URL always wins over the remembered one.
 *
 * @param state - the store's open deck and held decks
 * @param deck - the remembered deck, as the server answered it
 * @returns the change to apply; empty when another deck is open
 */
export function withReopenedDeck(
  state: OpenDeckState,
  deck: Deck
): Partial<OpenDeckState> {
  if (state.activeDeckId !== null) return {};
  return { activeDeckId: deck.id, decks: { ...state.decks, [deck.id]: deck } };
}
