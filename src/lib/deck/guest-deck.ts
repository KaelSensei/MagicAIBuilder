/**
 * The single deck a signed-out player builds, kept in this browser's
 * `localStorage` until they sign in and claim it (`guest-claim.ts`).
 *
 * Storage is best effort: when the browser blocks it or it is full, the guest
 * deck lives in memory for the visit and nothing throws.
 *
 * @module lib/deck/guest-deck
 */
import type { Deck } from "./types";

export const GUEST_DECK_ID = "guest";
export const GUEST_DECK_STORAGE_KEY = "magic-ai-builder:guest-deck:v1";

interface StoredGuestDeck extends Omit<Deck, "createdAt" | "updatedAt"> {
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Returns whether an operation targets the browser-only guest deck. */
export function isGuestDeckId(deckId: string): boolean {
  return deckId === GUEST_DECK_ID;
}

/** Creates the sole deck available to an unauthenticated browser. */
export function createGuestDeck(): Deck {
  const now = new Date();
  return {
    id: GUEST_DECK_ID,
    name: "Guest Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardRowCount: 0,
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Serializes a guest deck for browser storage. */
export function serializeGuestDeck(deck: Deck): string {
  const stored: StoredGuestDeck = {
    ...deck,
    id: GUEST_DECK_ID,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
  };
  return JSON.stringify(stored);
}

/** Restores a guest deck while rejecting unrelated or malformed values. */
export function deserializeGuestDeck(value: string | null): Deck | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("id" in parsed) ||
      parsed.id !== GUEST_DECK_ID ||
      !("createdAt" in parsed) ||
      typeof parsed.createdAt !== "string" ||
      !("updatedAt" in parsed) ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    const deck = parsed as StoredGuestDeck;
    return {
      ...deck,
      createdAt: new Date(deck.createdAt),
      updatedAt: new Date(deck.updatedAt),
    };
  } catch {
    return null;
  }
}

/**
 * Runs one operation on this browser's storage, or returns `fallback` when
 * there is no browser or the browser refuses.
 *
 * Browsers throw rather than return: reading `window.localStorage` throws a
 * `SecurityError` when site data is blocked (third-party or "block all
 * cookies" settings, some embedded views), and `setItem` throws a
 * `QuotaExceededError` when the quota is full and in some private modes. The
 * guest deck is a convenience, so a refusal means "nothing stored" and the
 * builder keeps the deck in memory for the visit.
 */
function withGuestStorage<T>(
  operation: (storage: Storage) => T,
  fallback: T
): T {
  if (typeof window === "undefined") return fallback;
  try {
    return operation(window.localStorage);
  } catch {
    return fallback;
  }
}

/**
 * Reads the single guest deck from this browser.
 *
 * @returns the saved deck, or null when none is saved, the value is malformed
 *   or the browser blocks storage
 */
export function loadGuestDeck(): Deck | null {
  return withGuestStorage(
    (storage) => deserializeGuestDeck(storage.getItem(GUEST_DECK_STORAGE_KEY)),
    null
  );
}

/**
 * Persists the single guest deck in this browser. Does nothing when the
 * browser blocks storage or the quota is full: the deck stays in memory only.
 *
 * @param deck - the guest deck to keep
 */
export function saveGuestDeck(deck: Deck): void {
  withGuestStorage((storage) => {
    storage.setItem(GUEST_DECK_STORAGE_KEY, serializeGuestDeck(deck));
  }, undefined);
}

/**
 * Removes the guest deck from this browser, once an account holds a copy.
 * Does nothing when the browser blocks storage, which then holds no copy.
 */
export function clearGuestDeck(): void {
  withGuestStorage((storage) => {
    storage.removeItem(GUEST_DECK_STORAGE_KEY);
  }, undefined);
}
