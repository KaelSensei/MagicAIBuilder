import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { DrawOddsPanel } from "./DrawOddsPanel";

/** One row of basic Forests, the deck's lands. */
function forests(quantity: number): DeckCard {
  return aDeckCard({
    id: "forest",
    name: "Forest",
    category: "land",
    typeLine: "Basic Land — Forest",
    quantity,
  });
}

/** Distinct one-copy creatures, the non-land part of a singleton deck. */
function spells(count: number): DeckCard[] {
  return Array.from({ length: count }, (_, index) =>
    aDeckCard({
      id: `spell-${index}`,
      name: `Spell ${index}`,
      category: "creature",
      typeLine: "Creature — Elf",
    })
  );
}

/**
 * A Commander deck whose library holds 99 cards, `lands` of them lands. The
 * commander sits in the command zone, outside `cards` (CR 903.6).
 */
function commanderDeck(lands = 36): Deck {
  return aDeck({
    commander: aDeckCard({ id: "commander", name: "Omnath, Locus of Mana" }),
    cards: [forests(lands), ...spells(99 - lands)],
  });
}

/** Mounts the Draw odds panel, where the section lives. */
function renderPanel(deck: Deck, locale: TestLocale = "en") {
  return renderWithProviders(<DrawOddsPanel deck={deck} />, { locale });
}

/** The section, found by its accessible name. */
function section(name = "Lands in the opening hand"): HTMLElement {
  return screen.getByRole("region", { name });
}

/** The land-drop table, found by its caption. */
function landDrops(): HTMLElement {
  return within(section()).getByRole("table", { name: "N lands by turn N" });
}

/** The cells of a table's row, found by its row header. */
function rowOf(table: HTMLElement, header: string): (string | null)[] {
  const row = within(table)
    .getByRole("rowheader", { name: header })
    .closest("tr");
  if (row === null) throw new Error(`no row for "${header}"`);
  return Array.from(row.cells, (cell) => cell.textContent);
}

describe("OpeningHandLands, in the Draw odds panel", () => {
  it("shows 2.5 lands on average in an opening seven of a 99-card library with 36 lands", () => {
    renderPanel(commanderDeck());

    // 7 × 36 / 99 = 2.545…, one decimal.
    expect(
      within(section()).getByText("2.5 lands on average in an opening seven")
    ).toBeVisible();
  });

  it("gives the chance of exactly 0 to 7 lands in a table with header cells, and says the rounded column may not add up to 100%", () => {
    renderPanel(commanderDeck());

    const spread = within(section()).getByRole("table", {
      name: "Lands in the opening seven",
    });
    expect(
      within(spread)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent)
    ).toEqual(["Lands", "Chance"]);
    expect(
      within(spread)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent)
    ).toEqual([
      "0 lands",
      "1 land",
      "2 lands",
      "3 lands",
      "4 lands",
      "5 lands",
      "6 lands",
      "7 lands",
    ]);
    // C(36, 2) · C(63, 5) / C(99, 7) = 1,133,685 / 3,811,324 ≈ 0.29745
    expect(rowOf(spread, "2 lands")).toEqual(["2 lands", "29.7%"]);
    // 340 / 606,347 ≈ 0.00056: a rare hand still shows its own figure.
    expect(rowOf(spread, "7 lands")).toEqual(["7 lands", "0.1%"]);
    expect(
      within(section()).getByText(
        "Each chance is rounded to one decimal, so the column may not add up to exactly 100%."
      )
    ).toBeVisible();
  });

  it("gives the chance of N lands by turn N for turns 1 to 7 at a Commander table, where turn 1 draws", () => {
    renderPanel(commanderDeck());

    const drops = landDrops();
    expect(
      within(drops)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent)
    ).toEqual(["Turn", "Lands", "Chance"]);
    expect(
      within(drops)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent)
    ).toEqual([
      "Turn 1",
      "Turn 2",
      "Turn 3",
      "Turn 4",
      "Turn 5",
      "Turn 6",
      "Turn 7",
    ]);
    // Ten cards drawn by turn 3 (CR 103.8c): 327,687,835 / 419,847,428 ≈ 0.78049
    expect(rowOf(drops, "Turn 3")).toEqual([
      "Turn 3",
      "3 lands or more",
      "78.0%",
    ]);
    expect(rowOf(drops, "Turn 1")).toEqual([
      "Turn 1",
      "1 land or more",
      "97.7%",
    ]);
    expect(
      within(section()).getByText(
        "Each turn counts the opening seven and the draws so far. Each turn adds one draw, turn 1 included, as at a multiplayer table."
      )
    ).toBeVisible();
  });

  it("skips the turn-1 draw for a Modern deck, played two-player, and says so", () => {
    renderPanel(
      aDeck({ format: "modern", cards: [forests(24), ...spells(36)] })
    );

    // Nine cards drawn by turn 3 (CR 103.8a), as the panel's own question
    // counts them: 52,994,507 / 67,196,103 ≈ 0.78865
    expect(rowOf(landDrops(), "Turn 3")).toEqual([
      "Turn 3",
      "3 lands or more",
      "78.9%",
    ]);
    expect(
      within(section()).getByText(
        "Each turn counts the opening seven and the draws so far. Each turn after the first adds one draw, as for the player who starts a two-player game."
      )
    ).toBeVisible();
  });

  it("says it counts the opening seven and the draws only, never land drops on curve", () => {
    renderPanel(commanderDeck());

    expect(
      within(section()).getByText(
        "Counts the opening seven and the draws only: no mulligan, no ramp, no color."
      )
    ).toBeVisible();
    expect(section()).not.toHaveTextContent(/on curve/iu);
  });

  it("recounts the figures when the deck's land count changes", () => {
    const { rerender } = renderPanel(commanderDeck());

    rerender(<DrawOddsPanel deck={commanderDeck(30)} />);

    // 7 × 30 / 99 = 2.12…
    expect(
      within(section()).getByText("2.1 lands on average in an opening seven")
    ).toBeVisible();
  });

  it("shows the same digits when the same deck is opened again", () => {
    const first = renderPanel(commanderDeck());
    const firstText = section().textContent;
    first.unmount();

    renderPanel(commanderDeck());

    expect(section().textContent).toBe(firstText);
  });

  it("keeps counting the lands while the panel's question asks about a card", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Looking for" }),
      "Spell 0"
    );

    expect(
      within(section()).getByText("2.5 lands on average in an opening seven")
    ).toBeVisible();
  });

  it("speaks French, with French percentages", () => {
    renderPanel(commanderDeck(), "fr");

    const french = section("Terrains dans la main de départ");
    expect(
      within(french).getByText("2,5 terrains en moyenne dans une main de sept")
    ).toBeVisible();
    // Intl writes the French percent sign after a narrow no-break space.
    const turnThree = rowOf(
      within(french).getByRole("table", { name: "N terrains au tour N" }),
      "Tour 3"
    );
    expect(turnThree.slice(0, 2)).toEqual(["Tour 3", "3 terrains ou plus"]);
    expect(turnThree[2]).toMatch(/^78,0\s%$/u);
  });
});

describe("OpeningHandLands, when the deck holds nothing to count (AC-97-05)", () => {
  it("says the main deck needs cards, with no table, when the library is empty", () => {
    renderPanel(aDeck({ cards: [{ ...forests(36), zone: "sideboard" }] }));

    expect(
      within(section()).getByText("Add cards to the main deck to see the odds.")
    ).toBeVisible();
    expect(within(section()).queryByRole("table")).not.toBeInTheDocument();
  });

  it("says no land is counted, with no table of zeros, when the main deck holds no land", () => {
    renderPanel(aDeck({ format: "modern", cards: spells(60) }));

    expect(
      within(section()).getByText("No land is counted in the main deck.")
    ).toBeVisible();
    expect(within(section()).queryByRole("table")).not.toBeInTheDocument();
    expect(section()).not.toHaveTextContent("%");
  });
});
