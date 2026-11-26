/**
 * The My Decks grid/list switch, driven as a player would: a named group of
 * two pressed-state buttons, drawn by the shared `SegmentedControl` (I-04).
 *
 * The real next-intl catalogs render (`renderWithProviders`). A small host
 * holds the view the way `/decks` does, starting on the grid, so a press can
 * move the chosen option.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import type { DecksViewMode } from "@/lib/deck/deck-listing";
import { renderWithProviders } from "@/test/render";
import { DecksHomeControls } from "./DecksHomeControls";

/** Every view the controls asked for, in order. */
let requestedViews: DecksViewMode[] = [];

/** The controls on the view `/decks` opens on, holding the view as the page does. */
function ControlsHost() {
  const [viewMode, setViewMode] = useState<DecksViewMode>("grid");
  return (
    <DecksHomeControls
      viewMode={viewMode}
      sortKey="updatedAt"
      sortDir="desc"
      onSetViewMode={(mode) => {
        requestedViews.push(mode);
        setViewMode(mode);
      }}
      onSetSort={() => undefined}
      onOpenWizard={() => undefined}
      onNewDeck={() => undefined}
      disableNewDeck={false}
      isCreating={false}
    />
  );
}

/** The visible names of the group's pressed options. */
function pressedViews(group: HTMLElement): readonly (string | null)[] {
  return within(group)
    .queryAllByRole("button", { pressed: true })
    .map((option) => option.textContent);
}

describe("the My Decks view switch", () => {
  beforeEach(() => {
    requestedViews = [];
  });

  it("is a group named « Deck view » whose one pressed option is Grid", () => {
    renderWithProviders(<ControlsHost />);

    const group = screen.getByRole("group", { name: "Deck view" });

    expect(pressedViews(group)).toEqual(["Grid"]);
  });

  // The labels stay visible (32 px `md` options with side padding), the track
  // keeps its outline against the page, and the switch stays hidden on phones.
  it("draws labelled 32 px options on an outlined track, hidden below the sm breakpoint", () => {
    renderWithProviders(<ControlsHost />);

    const group = screen.getByRole("group", { name: "Deck view" });

    expect(group).toHaveClass("border", "border-[var(--border)]");
    expect(group.parentElement).toHaveClass("hidden", "sm:flex");
    for (const option of within(group).getAllByRole("button")) {
      expect(option).toHaveClass("min-h-8", "px-3");
      expect(option.querySelector(".sr-only")).toBeNull();
    }
  });

  it("asks for the list view when the player presses List, and shows List as the chosen view", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlsHost />);
    const group = screen.getByRole("group", { name: "Deck view" });

    await user.click(within(group).getByRole("button", { name: "List" }));

    expect(requestedViews).toEqual(["list"]);
    expect(pressedViews(group)).toEqual(["List"]);
  });

  it("names the switch « Affichage des decks » and its views « Grille » and « Liste » in French", () => {
    renderWithProviders(<ControlsHost />, { locale: "fr" });

    const group = screen.getByRole("group", { name: "Affichage des decks" });

    expect(
      within(group)
        .getAllByRole("button")
        .map((option) => option.textContent)
    ).toEqual(["Grille", "Liste"]);
  });
});
