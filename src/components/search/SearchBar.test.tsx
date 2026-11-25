import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
import { SearchBar } from "./SearchBar";

beforeEach(() => {
  useShortcutPreferencesStore.getState().setSingleKeyShortcutsEnabled(true);
});

afterEach(() => {
  localStorage.clear();
});

describe("SearchBar", () => {
  it("advertises the '/' shortcut only while single-key shortcuts are on", () => {
    renderWithIntl(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByText("⌨ /")).toBeInTheDocument();

    act(() =>
      useShortcutPreferencesStore.getState().setSingleKeyShortcutsEnabled(false)
    );

    expect(screen.queryByText("⌨ /")).not.toBeInTheDocument();
  });

  // WCAG 2.2 SC 1.3.1 and 4.1.2: a placeholder is not a label, so the
  // card search box carries its own name from the catalogue.
  it("names the card search box for a screen reader", () => {
    renderWithIntl(<SearchBar onSearch={vi.fn()} />);

    expect(
      screen.getByRole("textbox", { name: "Search cards" })
    ).toHaveAttribute("placeholder", "Search cards…");
  });

  it("names the card search box in French", () => {
    renderWithIntl(<SearchBar onSearch={vi.fn()} />, { locale: "fr" });

    expect(
      screen.getByRole("textbox", { name: "Rechercher des cartes" })
    ).toBeInTheDocument();
  });

  it("keeps the name when a caller gives its own placeholder", () => {
    renderWithIntl(
      <SearchBar onSearch={vi.fn()} placeholder="Filter by name (optional)…" />
    );

    expect(
      screen.getByRole("textbox", { name: "Search cards" })
    ).toHaveAttribute("placeholder", "Filter by name (optional)…");
  });
});
