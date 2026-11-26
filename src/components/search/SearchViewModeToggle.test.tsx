/**
 * The search results' view switch (design audit S3, I-04): a named group whose chosen option is
 * pressed, so a screen reader hears which layout is on and a sighted player sees it without
 * relying on colour. The 28 px targets and the chosen option's marker belong to
 * `SegmentedControl`, whose own tests pin them.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { renderWithProviders } from "@/test/render";
import { SearchViewModeToggle } from "./SearchViewModeToggle";

beforeEach(() => {
  // The deck store is one module-wide instance: every test starts from its defaults.
  useDeckStore.setState(useDeckStore.getInitialState(), true);
});

describe("SearchViewModeToggle", () => {
  it("is a group named Result view in which only Grid view is pressed by default", () => {
    renderWithProviders(<SearchViewModeToggle />);

    const group = screen.getByRole("group", { name: "Result view" });
    expect(within(group).getAllByRole("button", { pressed: true })).toEqual([
      within(group).getByRole("button", { name: "Grid view" }),
    ]);
  });

  it("sets the store's view mode to list when List view is pressed, and presses List view instead", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchViewModeToggle />);

    await user.click(screen.getByRole("button", { name: "List view" }));

    expect(useDeckStore.getState().searchViewMode).toBe("list");
    expect(screen.getAllByRole("button", { pressed: true })).toEqual([
      screen.getByRole("button", { name: "List view" }),
    ]);
  });

  // The 28 px squares come from SegmentedControl's icon-only options at `sm`: a label shown as
  // text, or a larger size, would change the header row.
  it("draws two icon-only 28 px options at the end of the header row", () => {
    renderWithProviders(<SearchViewModeToggle />);

    const group = screen.getByRole("group", { name: "Result view" });
    expect(group).toHaveClass("ml-auto");
    for (const option of within(group).getAllByRole("button")) {
      expect(option).toHaveClass("min-h-7", "min-w-7", "px-0");
    }
  });

  it("names the group and its options in French for a French player", () => {
    renderWithProviders(<SearchViewModeToggle />, { locale: "fr" });

    const group = screen.getByRole("group", {
      name: "Affichage des résultats",
    });
    expect(
      within(group).getByRole("button", { name: "Vue grille", pressed: true })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "Vue liste", pressed: false })
    ).toBeInTheDocument();
  });
});
