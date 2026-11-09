import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SpellbookVariant } from "@/lib/combos/spellbook";
import { renderWithIntl } from "@/test/render-with-intl";
import { CombosPanel } from "./CombosPanel";

const SCEPTER: SpellbookVariant = {
  id: "4821-5261",
  cards: ["Dramatic Reversal", "Isochron Scepter"],
  effects: ["Infinite storm count"],
  description:
    "Activate Isochron Scepter, casting a copy of Dramatic Reversal.",
  isInfinite: true,
  prerequisites: {
    otherPieces: [],
    conditions: [
      "Nonland permanents you control can tap to produce at least {3}.",
    ],
    manaNeeded: "",
  },
};

const HULLBREAKER: SpellbookVariant = {
  id: "513-5034--46",
  cards: ["Hullbreaker Horror", "Sol Ring"],
  effects: ["Infinite colorless mana"],
  description: "Cast Sol Ring, return it to hand.",
  isInfinite: true,
  prerequisites: {
    otherPieces: ["Permanent Castable for {C}"],
    conditions: [],
    manaNeeded: "{1}",
  },
};

const OBSERVED_AT = new Date("2026-11-03T12:00:00.000Z");

/** The list item of the combo that shows this card. */
function comboItem(cardName: string): HTMLElement {
  const item = screen.getByText(cardName).closest("li");
  if (!item) throw new Error(`no combo shows ${cardName}`);
  return item;
}

describe("CombosPanel", () => {
  it("discloses Commander Spellbook and when its results were observed", () => {
    renderWithIntl(<CombosPanel combos={[]} observedAt={OBSERVED_AT} />);

    expect(screen.getByText("Commander Spellbook")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Commander Spellbook results observed Nov 3, 2026")
    ).toBeInTheDocument();
  });

  it("shows what else each combo needs", () => {
    renderWithIntl(
      <CombosPanel combos={[SCEPTER, HULLBREAKER]} observedAt={OBSERVED_AT} />
    );

    const scepter = comboItem("Isochron Scepter");
    expect(within(scepter).getByText("Prerequisites")).toBeInTheDocument();
    expect(
      within(scepter).getByText(
        "Nonland permanents you control can tap to produce at least {3}."
      )
    ).toBeInTheDocument();

    const hullbreaker = comboItem("Hullbreaker Horror");
    expect(
      within(hullbreaker).getByText("Also needs: Permanent Castable for {C}")
    ).toBeInTheDocument();
    expect(
      within(hullbreaker).getByText("Mana needed: {1}")
    ).toBeInTheDocument();
  });

  it("links each combo to its Commander Spellbook page", () => {
    renderWithIntl(<CombosPanel combos={[SCEPTER]} observedAt={OBSERVED_AT} />);

    expect(
      screen.getByRole("link", { name: "Steps on Commander Spellbook" })
    ).toHaveAttribute(
      "href",
      "https://commanderspellbook.com/combo/4821-5261/"
    );
  });

  it("shows prerequisites in French", () => {
    renderWithIntl(
      <CombosPanel combos={[HULLBREAKER]} observedAt={OBSERVED_AT} />,
      {
        locale: "fr",
      }
    );

    expect(screen.getByText("Prérequis")).toBeInTheDocument();
    expect(
      screen.getByText("Il faut aussi : Permanent Castable for {C}")
    ).toBeInTheDocument();
    expect(screen.getByText("Mana nécessaire : {1}")).toBeInTheDocument();
  });

  it("says the check did not run when Spellbook is unavailable, instead of reporting no combos", () => {
    renderWithIntl(<CombosPanel isUnavailable />);

    expect(
      screen.getByText(/Commander Spellbook could not be reached/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No known combos detected")
    ).not.toBeInTheDocument();
  });
});
