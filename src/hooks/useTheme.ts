"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
  DEFAULT_THEME_SNAPSHOT,
  THEME_STORAGE_KEY,
  readStoredThemeSnapshot,
  resolveTheme,
  type ThemeMode,
  type ThemePreference,
} from "@/lib/theme/preference";

/** Store fields the theme controls read. Actions stay referentially stable. */
interface ThemeStore {
  theme: ThemeMode;
  preference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  /**
   * Stores a choice and paints the matching mode.
   * System uses the boolean captured at the call, then ThemeSync tracks changes.
   */
  setPreference: (preference: ThemePreference, systemPrefersDark: boolean) => void;
  /** Updates the painted mode without changing the person's choice. */
  setResolvedTheme: (theme: ThemeMode) => void;
}

/** v0 stored only `theme`. v1 adds an explicit preference. */
const THEME_STORAGE_VERSION = 1;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME_SNAPSHOT.theme,
      preference: DEFAULT_THEME_SNAPSHOT.preference,
      toggleTheme: () =>
        set((state) => {
          const next: ThemeMode = state.theme === "dark" ? "light" : "dark";
          return { theme: next, preference: next };
        }),
      setTheme: (theme) => set({ theme, preference: theme }),
      setPreference: (preference, systemPrefersDark) =>
        set({
          preference,
          theme: resolveTheme(preference, systemPrefersDark),
        }),
      setResolvedTheme: (theme) =>
        set((state) => (state.theme === theme ? state : { theme })),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: THEME_STORAGE_VERSION,
      partialize: (state) => ({
        theme: state.theme,
        preference: state.preference,
      }),
      migrate: (persisted: unknown) => readStoredThemeSnapshot(persisted),
    }
  )
);

/**
 * Theme preference and the actions that change it.
 *
 * @returns the painted mode, the stored choice, and the setters
 */
export function useTheme() {
  return useThemeStore(
    useShallow((state) => ({
      theme: state.theme,
      preference: state.preference,
      toggleTheme: state.toggleTheme,
      setTheme: state.setTheme,
      setPreference: state.setPreference,
    }))
  );
}
