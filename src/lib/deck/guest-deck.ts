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
    cardCount: 0,
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

/** Reads the single guest deck from this browser. */
export function loadGuestDeck(): Deck | null {
  if (typeof window === "undefined") return null;
  return deserializeGuestDeck(
    window.localStorage.getItem(GUEST_DECK_STORAGE_KEY)
  );
}

/** Persists the single guest deck in this browser. */
export function saveGuestDeck(deck: Deck): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_DECK_STORAGE_KEY, serializeGuestDeck(deck));
}
