"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { DARK_COLOR_SCHEME_QUERY, type ThemePreference } from "@/lib/theme/preference";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/SegmentedControl";

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
 * A segmented control of three icons, each named for screen readers; the
 * chosen one is raised and outlined rather than only recoloured (design audit
 * S3: the chosen icon differed by 1.18:1).
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

  const options = THEME_OPTIONS.map(
    ({ preference: option, Icon }): SegmentedOption<ThemePreference> => ({
      value: option,
      label: themeChoiceLabel(option, t),
      icon: <Icon className="h-4 w-4" />,
      hideLabel: true,
    })
  );

  return (
    <SegmentedControl
      aria-label={t("theme.toggle")}
      options={options}
      value={preference}
      onChange={handleSelect}
      className="border border-[var(--border)]"
    />
  );
}
