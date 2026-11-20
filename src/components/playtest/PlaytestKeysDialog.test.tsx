/**
 * The playtest's cheat sheet, opened inside the real playtest: it lists every key of the table
 * the keyboard reads, opens from `?` and from its button, closes on Escape with the focus back
 * where it was, and says when the player's single-key switch has turned the letters off.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaytestModal } from "./PlaytestModal";
import { usePlaytestStore } from "@/lib/playtest/store";
import { PLAYTEST_HOTKEYS } from "@/lib/playtest/hotkeys";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
import type { TestLocale } from "@/test/render";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders } from "@/test/render";

const DECK = aDeck({
  name: "Kenrith Goodstuff",
  format: "commander",
  cards: Array.from({ length: 40 }, (_, index) =>
    aDeckCard({ id: `c${index}`, name: `Card ${index}` })
  ),
  cardRowCount: 40,
});

function openPlaytest(locale: TestLocale = "en") {
  const user = userEvent.setup();
  renderWithProviders(<PlaytestModal deck={DECK} onClose={vi.fn()} />, {
    locale,
  });
  return user;
}

beforeEach(() => {
  usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
  useShortcutPreferencesStore.setState({ singleKeyShortcutsEnabled: true });
});

describe("the playtest's cheat sheet", () => {
  it("? opens the cheat sheet listing every key of the table", async () => {
    const user = openPlaytest();
    await user.click(
      screen.getByRole("button", { name: /draw opening hand/i })
    );

    await user.keyboard("?");

    const sheet = screen.getByRole("dialog", { name: "Playtest keys" });
    expect(within(sheet).getAllByRole("term")).toHaveLength(
      PLAYTEST_HOTKEYS.length
    );
    for (const hotkey of PLAYTEST_HOTKEYS) {
      for (const label of hotkey.labels) {
        expect(within(sheet).getByText(label)).toBeInTheDocument();
      }
    }
    expect(within(sheet).getByText("Draw a card")).toBeInTheDocument();
    expect(within(sheet).getByText("Shuffle your library")).toBeInTheDocument();
  });

  it("opens from the Keys button and returns the focus to it on Escape", async () => {
    const user = openPlaytest();
    const button = screen.getByRole("button", { name: "Keys" });

    await user.click(button);
    expect(
      screen.getByRole("dialog", { name: "Playtest keys" })
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Playtest keys" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /playtest/i })
    ).toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("plays no move behind it while it is open", async () => {
    const user = openPlaytest();
    await user.click(
      screen.getByRole("button", { name: /draw opening hand/i })
    );
    const before = usePlaytestStore.getState().engine;

    await user.click(screen.getByRole("button", { name: "Keys" }));
    await user.keyboard("dns");

    expect(usePlaytestStore.getState().engine).toBe(before);
  });

  it("says only Ctrl+Z works when the single-key switch is off", async () => {
    useShortcutPreferencesStore.setState({ singleKeyShortcutsEnabled: false });
    const user = openPlaytest();

    await user.click(screen.getByRole("button", { name: "Keys" }));

    expect(
      screen.getByText(/single-key shortcuts are off, so only ctrl\+z/i)
    ).toBeInTheDocument();
  });

  it("keeps the letters in French and translates what they do", async () => {
    const user = openPlaytest("fr");

    await user.click(screen.getByRole("button", { name: "Touches" }));

    const sheet = screen.getByRole("dialog", {
      name: "Touches du test de jeu",
    });
    expect(within(sheet).getByText("D")).toBeInTheDocument();
    expect(within(sheet).getByText("Piocher une carte")).toBeInTheDocument();
    expect(
      within(sheet).getByText("Mélanger ta bibliothèque")
    ).toBeInTheDocument();
  });
});
