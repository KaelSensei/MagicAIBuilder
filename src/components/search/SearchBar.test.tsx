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
});
