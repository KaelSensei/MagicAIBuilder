"use client";
// Keyboard shortcut preferences — kept in this browser, like the theme choice.
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** localStorage key shared with the Zustand persist middleware. */
export const SHORTCUT_PREFERENCES_STORAGE_KEY = "magic-ai-builder-shortcuts";

/** Single-key shortcuts start on, as they always have. */
const DEFAULT_SINGLE_KEY_SHORTCUTS_ENABLED = true;

/** Shortcut preferences and the action that changes them. */
export interface ShortcutPreferencesStore {
  /**
   * Whether keys pressed without Ctrl or ⌘ (`/`, `?`, Esc, the arrows and
   * Enter) act as deck builder shortcuts. Speech-input and screen-reader users
   * can turn them off, as WCAG 2.2 SC 2.1.4 requires; Ctrl/⌘ shortcuts keep
   * working either way.
   */
  readonly singleKeyShortcutsEnabled: boolean;
  /** Turns the single-key shortcuts on or off and remembers the choice. */
  readonly setSingleKeyShortcutsEnabled: (enabled: boolean) => void;
}

/**
 * Reads the stored switch from an untrusted persisted blob.
 *
 * @param persisted - the state part of the localStorage value, or anything else
 * @returns the stored boolean, or on when it is missing or not a boolean
 */
export function readSingleKeyShortcutsEnabled(persisted: unknown): boolean {
  if (
    typeof persisted === "object" &&
    persisted !== null &&
    "singleKeyShortcutsEnabled" in persisted &&
    typeof persisted.singleKeyShortcutsEnabled === "boolean"
  ) {
    return persisted.singleKeyShortcutsEnabled;
  }
  return DEFAULT_SINGLE_KEY_SHORTCUTS_ENABLED;
}

/** Shortcut preferences, persisted to localStorage so guests keep them too. */
export const useShortcutPreferencesStore = create<ShortcutPreferencesStore>()(
  persist(
    (set) => ({
      singleKeyShortcutsEnabled: DEFAULT_SINGLE_KEY_SHORTCUTS_ENABLED,
      setSingleKeyShortcutsEnabled: (enabled) =>
        set({ singleKeyShortcutsEnabled: enabled }),
    }),
    {
      name: SHORTCUT_PREFERENCES_STORAGE_KEY,
      partialize: (state) => ({
        singleKeyShortcutsEnabled: state.singleKeyShortcutsEnabled,
      }),
      merge: (persisted, current) => ({
        ...current,
        singleKeyShortcutsEnabled: readSingleKeyShortcutsEnabled(persisted),
      }),
    }
  )
);
