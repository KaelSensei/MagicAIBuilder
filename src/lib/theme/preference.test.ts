import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import {
  readStoredThemeSnapshot,
  resolveTheme,
  themeBootScript,
} from "./preference";

/**
 * Paints `data-theme` the way the blocking boot script does.
 *
 * @param raw - persisted JSON, or null when nothing is stored
 * @param prefersDark - current `prefers-color-scheme`
 * @returns the attribute written, or null when the script bails out
 */
function bootTheme(raw: string | null, prefersDark: boolean): string | null {
  let painted: string | null = null;
  runInNewContext(themeBootScript(), {
    localStorage: {
      getItem: () => raw,
    },
    window: {
      matchMedia: () => ({ matches: prefersDark }),
    },
    document: {
      documentElement: {
        setAttribute: (_name: string, value: string) => {
          painted = value;
        },
      },
    },
  });
  return painted;
}

describe("resolveTheme", () => {
  it("keeps an explicit light choice", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("keeps an explicit dark choice", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows a dark system preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
  });

  it("follows a light system preference", () => {
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("readStoredThemeSnapshot", () => {
  it("keeps a v0 explicit theme instead of switching that user to system", () => {
    expect(readStoredThemeSnapshot({ theme: "light" })).toEqual({
      theme: "light",
      preference: "light",
    });
  });

  it("reads the Zustand persist envelope", () => {
    expect(
      readStoredThemeSnapshot({ state: { theme: "dark", preference: "system" } })
    ).toEqual({ theme: "dark", preference: "system" });
  });

  it("lets an explicit preference win over a stale resolved theme", () => {
    expect(readStoredThemeSnapshot({ theme: "dark", preference: "light" })).toEqual({
      theme: "light",
      preference: "light",
    });
  });

  it("falls back to the current dark default when storage is unusable", () => {
    expect(readStoredThemeSnapshot(null)).toEqual({
      theme: "dark",
      preference: "dark",
    });
    expect(readStoredThemeSnapshot({ theme: "sepia" })).toEqual({
      theme: "dark",
      preference: "dark",
    });
  });
});

describe("themeBootScript", () => {
  it("paints the same mode the pure resolver would choose", () => {
    const cases: readonly { readonly raw: string | null; readonly prefersDark: boolean }[] = [
      { raw: null, prefersDark: false },
      { raw: JSON.stringify({ state: { theme: "light" }, version: 0 }), prefersDark: true },
      { raw: JSON.stringify({ state: { theme: "dark" }, version: 0 }), prefersDark: false },
      {
        raw: JSON.stringify({
          state: { theme: "dark", preference: "system" },
          version: 1,
        }),
        prefersDark: false,
      },
      {
        raw: JSON.stringify({
          state: { theme: "light", preference: "system" },
          version: 1,
        }),
        prefersDark: true,
      },
      {
        raw: JSON.stringify({
          state: { theme: "dark", preference: "light" },
          version: 1,
        }),
        prefersDark: true,
      },
    ];

    for (const sample of cases) {
      const parsed: unknown = sample.raw === null ? null : JSON.parse(sample.raw);
      const snapshot = readStoredThemeSnapshot(parsed);
      expect(bootTheme(sample.raw, sample.prefersDark)).toBe(
        resolveTheme(snapshot.preference, sample.prefersDark)
      );
    }
  });

  it("leaves the document alone when storage is corrupt", () => {
    expect(bootTheme("{", true)).toBeNull();
  });
});
