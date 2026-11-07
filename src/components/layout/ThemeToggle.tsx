"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { DARK_COLOR_SCHEME_QUERY, type ThemePreference } from "@/lib/theme/preference";
import { cn } from "@/components/ui/utils";

const THEME_OPTIONS = [
  { preference: "light", Icon: Sun },
  { preference: "dark", Icon: Moon },
  { preference: "system", Icon: Monitor },
] as const;

/**
 * Resolves the accessible name for one theme choice.
 *
 * @param preference - the choice the button selects
 * @param t - `common` translator
 * @returns the localized button label
 */
function themeChoiceLabel(
  preference: ThemePreference,
  t: ReturnType<typeof useTranslations>
): string {
  switch (preference) {
    case "light":
      return t("theme.useLight");
    case "dark":
      return t("theme.useDark");
    case "system":
      return t("theme.useSystem");
    default: {
      const _exhaustive: never = preference;
      return _exhaustive;
    }
  }
}

/**
 * Reads the operating-system color scheme at the moment of a click.
 *
 * @returns true when the system currently prefers dark
 */
function readSystemPrefersDark(): boolean {
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches;
}

/**
 * Light, dark, and system choices for the Lumen appearance.
 * An explicit light or dark choice stays put; system follows the OS.
 *
 * @returns the segmented theme control
 */
export function ThemeToggle() {
  const t = useTranslations("common");
  const { preference, setPreference } = useTheme();

  const handleSelect = useCallback(
    (next: ThemePreference) => {
      setPreference(next, readSystemPrefersDark());
    },
    [setPreference]
  );

  return (
    <fieldset
      aria-label={t("theme.toggle")}
      className="flex items-center gap-0.5 rounded-[var(--lumen-radius-pill)] border border-[var(--border)] bg-[var(--background)] p-0.5"
    >
      {THEME_OPTIONS.map(({ preference: option, Icon }) => {
        const selected = preference === option;
        const label = themeChoiceLabel(option, t);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            aria-label={label}
            title={label}
            onClick={() => handleSelect(option)}
            className={cn(
              "rounded-[var(--lumen-radius-pill)] p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              selected
                ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </fieldset>
  );
}
