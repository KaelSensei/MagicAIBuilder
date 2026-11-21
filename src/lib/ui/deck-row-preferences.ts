"use client";
/**
 * What the deck editor's rows show, kept in this browser like the shortcut
 * preferences (`shortcut-preferences.ts`): no account setting, no migration.
 *
 * Today it holds the "Collection" switch, which hides or shows the Owned and
 * Buy badges on every zone's rows (I-37 requirement 6.5, the ownership marker).
 *
 * @module ui/deck-row-preferences
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** localStorage key shared with the Zustand persist middleware. */
export const DECK_ROW_PREFERENCES_STORAGE_KEY = "magic-ai-builder-deck-rows";

/** The badges start shown, as they always were before the switch existed. */
const DEFAULT_SHOW_COLLECTION_BADGES = true;

/** Deck row preferences and the action that changes them. */
export interface DeckRowPreferencesStore {
  /** Whether a deck row shows its Owned or Buy badge. */
  readonly showCollectionBadges: boolean;
  /** Shows or hides the Owned and Buy badges and remembers the choice. */
  readonly setShowCollectionBadges: (show: boolean) => void;
}

/**
 * Reads the stored switch from an untrusted persisted blob.
 *
 * @param persisted - the state part of the localStorage value, or anything else
 * @returns the stored boolean, or shown when it is missing or not a boolean
 */
export function readShowCollectionBadges(persisted: unknown): boolean {
  if (
    typeof persisted === "object" &&
    persisted !== null &&
    "showCollectionBadges" in persisted &&
    typeof persisted.showCollectionBadges === "boolean"
  ) {
    return persisted.showCollectionBadges;
  }
  return DEFAULT_SHOW_COLLECTION_BADGES;
}

/** Deck row preferences, persisted to localStorage across reloads and decks. */
export const useDeckRowPreferencesStore = create<DeckRowPreferencesStore>()(
  persist(
    (set) => ({
      showCollectionBadges: DEFAULT_SHOW_COLLECTION_BADGES,
      setShowCollectionBadges: (show) => set({ showCollectionBadges: show }),
    }),
    {
      name: DECK_ROW_PREFERENCES_STORAGE_KEY,
      partialize: (state) => ({
        showCollectionBadges: state.showCollectionBadges,
      }),
      merge: (persisted, current) => ({
        ...current,
        showCollectionBadges: readShowCollectionBadges(persisted),
      }),
    }
  )
);
