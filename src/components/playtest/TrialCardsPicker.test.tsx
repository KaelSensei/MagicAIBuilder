/**
 * The new-card trial picker on the playtest start screen: a player chooses main-deck copies to
 * start in the opening hand. Rendered in a small stateful harness, as the start screen holds the
 * choice.
 */
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { renderWithProviders } from "@/test/render";
import { TrialCardsPicker } from "./TrialCardsPicker";

function makeCard(
  id: string,
  name: string,
  extra: Partial<DeckCard> = {}
): DeckCard {
  return aDeckCard({ id, scryfallId: id, name, ...extra });
}

const DECK_CARDS: readonly DeckCard[] = [
  makeCard("tithe", "Smothering Tithe"),
  makeCard("ring", "Sol Ring"),
  makeCard("bolt", "Lightning Bolt", { quantity: 2 }),
  makeCard("negate", "Negate", { zone: "sideboard" }),
  makeCard("maybe", "Maybe Card", { zone: "maybeboard" }),
];

/** Holds the choice as the start screen does, and shows the ids it would deal. */
function Harness({ cards }: { readonly cards: readonly DeckCard[] }) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  return (
    <>
      <TrialCardsPicker
        cards={cards}
        selected={selected}
        onChange={setSelected}
      />
      <output aria-label="chosen ids">{selected.join(",")}</output>
    </>
  );
}

/** The text of the label a checkbox sits in: what the player reads beside it. */
function labelOf(box: HTMLElement): string | undefined {
  return box.closest("label")?.textContent ?? undefined;
}

function renderPicker(
  cards: readonly DeckCard[] = DECK_CARDS,
  locale?: "en" | "fr"
) {
  renderWithProviders(<Harness cards={cards} />, { locale });
  return {
    user: userEvent.setup(),
    group: screen.getByRole("group", {
      name: /start with these cards|commencer avec ces cartes/i,
    }),
  };
}

describe("TrialCardsPicker", () => {
  it("offers one checkbox per main-deck copy, and nothing from the sideboard or the cards being considered", () => {
    const { group } = renderPicker();

    expect(within(group).getAllByRole("checkbox").map(labelOf)).toEqual([
      "Smothering Tithe",
      "Sol Ring",
      "Lightning Bolt (copy 1 of 2)",
      "Lightning Bolt (copy 2 of 2)",
    ]);
  });

  it("names the chosen cards in text and hands their copy ids to the start screen", async () => {
    const { user } = renderPicker();

    await user.click(
      screen.getByRole("checkbox", { name: "Smothering Tithe" })
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Lightning Bolt (copy 2 of 2)" })
    );

    expect(
      screen.getByText("Chosen: Smothering Tithe, Lightning Bolt")
    ).toBeInTheDocument();
    expect(screen.getByText("2 of 7 chosen")).toBeInTheDocument();
    expect(screen.getByLabelText("chosen ids")).toHaveTextContent(
      "tithe,bolt#2"
    );
  });

  it("unchooses a card when its box is cleared", async () => {
    const { user } = renderPicker();
    const tithe = screen.getByRole("checkbox", { name: "Smothering Tithe" });

    await user.click(tithe);
    await user.click(tithe);

    expect(tithe).not.toBeChecked();
    expect(screen.getByLabelText("chosen ids")).toHaveTextContent("");
  });

  it("searches the main deck by name", async () => {
    const { user } = renderPicker();

    await user.type(
      screen.getByRole("searchbox", { name: "Search the main deck" }),
      "sol"
    );

    expect(screen.getAllByRole("checkbox").map(labelOf)).toEqual(["Sol Ring"]);
  });

  it("keeps a chosen card chosen while the search hides it", async () => {
    const { user } = renderPicker();
    await user.click(
      screen.getByRole("checkbox", { name: "Smothering Tithe" })
    );

    await user.type(
      screen.getByRole("searchbox", { name: "Search the main deck" }),
      "bolt"
    );

    expect(screen.getByText("Chosen: Smothering Tithe")).toBeInTheDocument();
    expect(screen.getByLabelText("chosen ids")).toHaveTextContent("tithe");
  });

  it("says when no main-deck card matches the search", async () => {
    const { user } = renderPicker();

    await user.type(
      screen.getByRole("searchbox", { name: "Search the main deck" }),
      "zzz"
    );

    expect(screen.queryAllByRole("checkbox")).toEqual([]);
    expect(
      screen.getByText("No main-deck card matches “zzz”.")
    ).toBeInTheDocument();
  });

  it("refuses an eighth copy once seven are chosen, and says so", () => {
    const cards = Array.from({ length: 9 }, (_, i) =>
      makeCard(`c${i}`, `Card ${i}`)
    );
    renderPicker(cards);

    for (const name of [
      "Card 0",
      "Card 1",
      "Card 2",
      "Card 3",
      "Card 4",
      "Card 5",
      "Card 6",
    ]) {
      fireEvent.click(screen.getByRole("checkbox", { name }));
    }

    expect(screen.getByRole("checkbox", { name: "Card 7" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Card 0" })).toBeEnabled();
    expect(
      screen.getByText("You can choose up to 7 cards.")
    ).toBeInTheDocument();
    expect(screen.getByText("7 of 7 chosen")).toBeInTheDocument();
  });

  it("says there is nothing to choose when the main deck is empty", () => {
    renderPicker([makeCard("negate", "Negate", { zone: "sideboard" })]);

    expect(
      screen.getByText("The main deck has no cards to choose.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("speaks French", () => {
    renderPicker(DECK_CARDS, "fr");

    expect(
      screen.getByRole("searchbox", {
        name: "Rechercher dans le deck principal",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("0 sur 7 choisies")).toBeInTheDocument();
  });
});
