"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/hooks/useTheme";
import { DARK_COLOR_SCHEME_QUERY, resolveTheme } from "@/lib/theme/preference";

/**
 * Paints the resolved Lumen mode on the document.
 *
 * Waits for persist hydration so the default dark state cannot overwrite the
 * pre-paint boot script while storage is still being read.
 *
 * @returns nothing — the component only writes `data-theme`
 */
export function ThemeSync() {
  const preference = useThemeStore((state) => state.preference);
  const setResolvedTheme = useThemeStore((state) => state.setResolvedTheme);
  // Persist is absent during SSR (no localStorage). Start false on both sides
  // so the server markup matches the first client render; the boot script
  // already painted data-theme.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useThemeStore.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }

    const unsubscribe = persistApi.onFinishHydration(() => {
      setHydrated(true);
    });
    if (persistApi.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia(DARK_COLOR_SCHEME_QUERY)
        : undefined;
    const apply = () => {
      const theme = resolveTheme(preference, media?.matches ?? true);
      document.documentElement.dataset.theme = theme;
      setResolvedTheme(theme);
    };

    apply();
    if (preference !== "system" || !media) return;

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [hydrated, preference, setResolvedTheme]);

  return null;
}
