/**
 * Theme preference for the Lumen appearance.
 *
 * `preference` is what the person chose. `theme` is the mode painted on the
 * document. System follows `prefers-color-scheme` and never overwrites an
 * explicit light or dark choice already stored by an older build.
 */

/** Painted appearance. */
export const THEME_MODES = ["light", "dark"] as const;

/** A painted appearance. */
export type ThemeMode = (typeof THEME_MODES)[number];

/** User choice, including following the operating system. */
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

/** A stored choice: explicit light, explicit dark, or the operating system. */
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Persisted snapshot. `theme` is the last resolved mode. */
export interface ThemeSnapshot {
  theme: ThemeMode;
  preference: ThemePreference;
}

/** Current product default: dark, chosen explicitly so system is opt-in. */
export const DEFAULT_THEME_SNAPSHOT: ThemeSnapshot = {
  theme: "dark",
  preference: "dark",
};

/** localStorage key shared with the Zustand persist middleware. */
export const THEME_STORAGE_KEY = "magic-ai-builder-theme";

/** Media query mirrored by the pre-paint boot script. */
export const DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * Checks whether a value is one of the two painted modes.
 *
 * @param value - untrusted storage or event payload
 * @returns true when the value is `light` or `dark`
 */
export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

/**
 * Checks whether a value is a stored preference.
 *
 * @param value - untrusted storage payload
 * @returns true when the value is `light`, `dark`, or `system`
 */
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Resolves the mode painted on the document.
 *
 * @param preference - explicit choice, or system
 * @param systemPrefersDark - current `prefers-color-scheme: dark`
 * @returns the mode to apply
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ThemeMode {
  switch (preference) {
    case "light":
    case "dark":
      return preference;
    case "system":
      return systemPrefersDark ? "dark" : "light";
    default: {
      const _exhaustive: never = preference;
      return _exhaustive;
    }
  }
}

/**
 * Checks whether a value is a plain object record.
 *
 * @param value - candidate payload
 * @returns true for non-null, non-array objects
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a Zustand persist blob, keeping v0 `{ theme }` choices explicit.
 *
 * @param raw - parsed `localStorage` value, the inner state, or anything else
 * @returns a snapshot; invalid input falls back to the dark default
 */
export function readStoredThemeSnapshot(raw: unknown): ThemeSnapshot {
  if (!isRecord(raw)) return { ...DEFAULT_THEME_SNAPSHOT };

  const state = isRecord(raw.state) ? raw.state : raw;
  const theme = isThemeMode(state.theme) ? state.theme : DEFAULT_THEME_SNAPSHOT.theme;
  const preference = isThemePreference(state.preference) ? state.preference : theme;

  return {
    theme: preference === "system" ? theme : preference,
    preference,
  };
}

/**
 * Inline script that paints `data-theme` before React hydrates.
 * Mirrors `readStoredThemeSnapshot` followed by `resolveTheme`.
 *
 * @returns JavaScript source safe to embed in a blocking script tag
 */
export function themeBootScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY);
  const query = JSON.stringify(DARK_COLOR_SCHEME_QUERY);

  return `(function(){
try {
  var stored = JSON.parse(localStorage.getItem(${key}) || "{}");
  var state = stored && typeof stored === "object" && stored.state && typeof stored.state === "object"
    ? stored.state
    : stored;
  var theme = state && (state.theme === "light" || state.theme === "dark") ? state.theme : "dark";
  var preference = state && (state.preference === "light" || state.preference === "dark" || state.preference === "system")
    ? state.preference
    : theme;
  if (preference === "system") {
    theme = window.matchMedia(${query}).matches ? "dark" : "light";
  } else {
    theme = preference;
  }
  document.documentElement.setAttribute("data-theme", theme);
} catch (_e) { /* default theme applied */ }
})();`;
}
