import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
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
 * A Commander deck whose library is 99 cards with 36 lands: I-97's definition
 * of done. The commander sits in the command zone, outside `cards` (CR 903.6).
 */
function commanderDeck(extra: readonly DeckCard[] = []): Deck {
  return aDeck({
    commander: aDeckCard({ id: "commander", name: "Omnath, Locus of Mana" }),
    cards: [forests(36), ...spells(63), ...extra],
  });
}

function renderPanel(deck: Deck, locale: TestLocale = "en") {
  return renderWithIntl(<DrawOddsPanel deck={deck} />, { locale });
}

/** The panel, found by its accessible name. */
function panel(name = "Draw Odds"): HTMLElement {
  return screen.getByRole("region", { name });
}

/** The value shown beside an input of the formula, by the input's label. */
function inputValue(label: string): string | null {
  return within(panel())
    .getByText(label, { selector: "dt" })
    .nextElementSibling?.textContent ?? null;
}

describe("DrawOddsPanel", () => {
  it("shows the chance of three or more lands in the opening seven of a 99-card library with 36 lands, with its inputs", () => {
    renderPanel(commanderDeck());

    // 26,736,733 / 53,358,536 ≈ 0.50108 (I-97's committed fraction).
    expect(within(panel()).getByRole("status")).toHaveTextContent("50.1%");
    expect(inputValue("Cards in the library")).toBe("99");
    expect(inputValue("Matching cards")).toBe("36");
    expect(inputValue("Cards drawn")).toBe("7");
    expect(inputValue("At least")).toBe("3");
    expect(
      within(panel()).getByText(
        "This is a count of equally likely hands, not a recorded game."
      )
    ).toBeVisible();
  });

  it("recounts the chance when the player asks for at least four lands", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    const minimum = within(panel()).getByRole("spinbutton", {
      name: "At least",
    });
    await user.clear(minimum);
    await user.type(minimum, "4");

    // 1,044,803 / 4,850,776 ≈ 0.21539
    expect(within(panel()).getByRole("status")).toHaveTextContent("21.5%");
    expect(inputValue("At least")).toBe("4");
  });

  it("counts a chosen card's copies in the library and asks for at least one", async () => {
    const user = userEvent.setup();
    renderPanel(
      aDeck({
        commander: aDeckCard({ id: "commander", name: "Omnath, Locus of Mana" }),
        cards: [forests(36), ...spells(62), aDeckCard({ id: "sol", name: "Sol Ring" })],
      })
    );

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "Looking for" }),
      "Sol Ring"
    );

    // One copy among 99 cards, seven drawn: 7 / 99 ≈ 0.07071
    expect(within(panel()).getByRole("status")).toHaveTextContent("7.1%");
    expect(inputValue("Cards in the library")).toBe("99");
    expect(inputValue("Matching cards")).toBe("1");
    expect(inputValue("At least")).toBe("1");
  });

  it("counts the opening seven and one draw per turn, turn 1 included, by turn 3 at a Commander table", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "When" }),
      "Turn 3"
    );

    // Ten cards drawn (CR 103.8c): 327,687,835 / 419,847,428 ≈ 0.78049
    expect(within(panel()).getByRole("status")).toHaveTextContent("78.0%");
    expect(inputValue("Cards drawn")).toBe("10");
    expect(
      within(panel()).getByText(
        "Each turn adds one draw, turn 1 included, as at a multiplayer table."
      )
    ).toBeVisible();
  });

  it("skips the turn-1 draw by turn 3 for a Modern deck, played two-player, and says so", async () => {
    const user = userEvent.setup();
    renderPanel(
      aDeck({
        format: "modern",
        cards: [forests(24), ...spells(36)],
      })
    );

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "When" }),
      "Turn 3"
    );

    // Nine cards drawn (CR 103.8a): 52,994,507 / 67,196,103 ≈ 0.78865
    expect(within(panel()).getByRole("status")).toHaveTextContent("78.9%");
    expect(inputValue("Cards in the library")).toBe("60");
    expect(inputValue("Cards drawn")).toBe("9");
    expect(
      within(panel()).getByText(
        "Each turn after the first adds one draw, as for the player who starts a two-player game."
      )
    ).toBeVisible();
  });

  it("says the main deck needs cards, instead of showing a zero, when the library is empty", () => {
    renderPanel(
      aDeck({
        commander: aDeckCard({ id: "commander", name: "Omnath, Locus of Mana" }),
        cards: [{ ...forests(36), zone: "maybeboard" }],
      })
    );

    const status = within(panel()).getByRole("status");
    expect(status).toHaveTextContent(
      "Add cards to the main deck to see the odds."
    );
    expect(status).not.toHaveTextContent("%");
  });

  it("asks for a whole number, instead of showing a zero, when the minimum is left blank", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await user.clear(
      within(panel()).getByRole("spinbutton", { name: "At least" })
    );

    const status = within(panel()).getByRole("status");
    expect(status).toHaveTextContent(
      "Enter a whole number of cards, 0 or more."
    );
    expect(status).not.toHaveTextContent("%");
    expect(inputValue("At least")).toBe("not set");
  });

  it("says the library is too short, instead of showing a figure, when a turn draws more cards than it holds", async () => {
    const user = userEvent.setup();
    renderPanel(aDeck({ cards: [forests(4), ...spells(5)] }));

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "When" }),
      "Turn 3"
    );

    const status = within(panel()).getByRole("status");
    expect(status).toHaveTextContent(
      "The library holds fewer cards than this draw."
    );
    expect(status).not.toHaveTextContent("%");
    expect(inputValue("Cards in the library")).toBe("9");
    expect(inputValue("Cards drawn")).toBe("10");
  });

  it("goes back to the lands when the chosen card leaves the library", async () => {
    const user = userEvent.setup();
    const solRing = aDeckCard({ id: "sol", name: "Sol Ring" });
    const { rerender } = renderPanel(commanderDeck([solRing]));
    const target = within(panel()).getByRole("combobox", {
      name: "Looking for",
    });
    await user.selectOptions(target, "Sol Ring");

    rerender(
      <DrawOddsPanel deck={commanderDeck([{ ...solRing, zone: "maybeboard" }])} />
    );

    expect(target).toHaveDisplayValue("Lands");
    expect(inputValue("Matching cards")).toBe("36");
  });

  it("shows the same digits when the same deck is opened again", () => {
    const first = renderPanel(commanderDeck());
    const firstFigure = within(panel()).getByRole("status").textContent;
    first.unmount();

    renderPanel(commanderDeck());

    expect(within(panel()).getByRole("status").textContent).toBe(firstFigure);
  });

  it("speaks French, with a French percentage, in the French locale", () => {
    renderPanel(commanderDeck(), "fr");

    const french = panel("Probabilités de pioche");
    // Intl writes the French percent sign after a narrow no-break space.
    expect(within(french).getByRole("status").textContent).toMatch(
      /^50,1\s%$/u
    );
    expect(
      within(french).getByRole("combobox", { name: "Chercher" })
    ).toHaveDisplayValue("Terrains");
    expect(
      within(french).getByRole("combobox", { name: "Quand" })
    ).toHaveDisplayValue("Main de départ");
    expect(
      within(french).getByRole("spinbutton", { name: "Au moins" })
    ).toHaveValue(3);
    expect(
      within(french).getByText(
        "C’est un dénombrement de mains également probables, pas une partie enregistrée."
      )
    ).toBeVisible();
  });
});
