/**
 * The library's card filter fields, with the real catalogs: adding and
 * removing names in each list, the list limit, and the search's status line.
 * The page test (`app/[locale]/decks/page.test.tsx`) covers the search end to
 * end.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DeckCardFilter } from "@/lib/deck/deck-card-filter";
import {
  NO_CARD_FILTER,
  type LibraryCardSearch,
} from "@/lib/deck/library-card-filter";
import { aDeck } from "@/test/builders/deck";
import { renderWithIntl } from "@/test/render";
import { DeckCardFilterFields } from "./DeckCardFilterFields";

/** The fields with their filter held in state, as the page holds it. */
function Harness({
  initial = NO_CARD_FILTER,
  search = { kind: "off" },
}: {
  readonly initial?: DeckCardFilter;
  readonly search?: LibraryCardSearch;
}) {
  const [filter, setFilter] = useState(initial);
  return (
    <DeckCardFilterFields
      filter={filter}
      onChange={setFilter}
      search={search}
    />
  );
}

/** The chips of one list, by the list's label. */
function chipsOf(label: string): readonly (string | null)[] {
  const group = screen.getByRole("group", { name: label });
  return within(group)
    .queryAllByRole("listitem")
    .map((chip) => chip.textContent);
}

describe("DeckCardFilterFields", () => {
  it("adds a name whole with Enter, commas included, and ignores the same name in another case", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const field = screen.getByRole("textbox", { name: "Has the card" });

    await user.type(field, "  Kenrith,   the Returned King {Enter}");
    await user.type(field, "kenrith, the returned king{Enter}");

    expect(chipsOf("Has the card")).toEqual(["Kenrith, the Returned King"]);
    expect(field).toHaveValue("");
  });

  it("keeps the two lists apart and removes a name from its chip", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.type(
      screen.getByRole("textbox", { name: "Leaves out" }),
      "Sol Ring{Enter}"
    );
    expect(chipsOf("Leaves out")).toEqual(["Sol Ring"]);
    expect(chipsOf("Has the card")).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Remove Sol Ring" }));

    expect(chipsOf("Leaves out")).toEqual([]);
  });

  it("stops a list at ten names, as one search accepts", () => {
    const ten = Array.from({ length: 10 }, (_, index) => `Card ${index + 1}`);
    renderWithIntl(<Harness initial={{ all: ten, none: [] }} />);

    expect(
      screen.getByRole("textbox", { name: "Has the card" })
    ).toBeDisabled();
    expect(
      screen.getByText("A field takes at most 10 cards.")
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Leaves out" })).toBeEnabled();
  });

  it("says the search is running, then offers a retry when it failed", async () => {
    const retry = vi.fn();
    const { rerender } = renderWithIntl(
      <Harness search={{ kind: "searching" }} />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Searching your decks…"
    );

    rerender(<Harness search={{ kind: "failed", retry }} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your decks could not be searched by card. The full list stays on screen."
    );
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("says how many decks it shows when more matched", () => {
    const decks = [aDeck({ id: "a" }), aDeck({ id: "b" })];
    renderWithIntl(
      <Harness search={{ kind: "found", decks, hasMore: true }} />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing the 2 most recently edited decks that match."
    );
  });

  it("speaks French with the French catalog", () => {
    renderWithIntl(<Harness />, { locale: "fr" });

    expect(
      screen.getByRole("group", { name: "Contient la carte" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Sans la carte" })
    ).toBeInTheDocument();
  });
});
