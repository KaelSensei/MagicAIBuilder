import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useThemeStore } from "@/hooks/useTheme";
import { ThemeSync } from "./ThemeSync";

/**
 * Hides the persist API the way SSR does when localStorage is missing.
 *
 * @param run - assertion that must survive a store with no persist helper
 */
function withoutPersist(run: () => void): void {
  const current = Object.getOwnPropertyDescriptor(useThemeStore, "persist");
  Object.defineProperty(useThemeStore, "persist", {
    configurable: true,
    value: undefined,
  });
  try {
    run();
  } finally {
    if (current) Object.defineProperty(useThemeStore, "persist", current);
  }
}

describe("ThemeSync", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark", preference: "dark" });
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("paints an explicit light choice onto the document", async () => {
    useThemeStore.setState({ theme: "light", preference: "light" });

    render(<ThemeSync />);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
  });

  it("follows a light operating system when the choice is system", async () => {
    useThemeStore.setState({ theme: "dark", preference: "system" });
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: !query.includes("dark"),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));

    render(<ThemeSync />);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
    expect(useThemeStore.getState().preference).toBe("system");
  });

  it("still paints a theme when persist storage is unavailable", async () => {
    useThemeStore.setState({ theme: "light", preference: "light" });

    withoutPersist(() => {
      render(<ThemeSync />);
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
  });
});
