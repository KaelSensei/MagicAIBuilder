/**
 * I-15 slice 1: the rule 0 form shows declared fields, in English and French,
 * and does not offer a share or a computed bracket.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RuleZeroSheetEditor } from "@/components/deck/RuleZeroSheetEditor";
import type { RuleZeroSheetDraft } from "@/lib/rule-zero/sheet";
import { renderWithIntl } from "@/test/render-with-intl";

const DRAFT: RuleZeroSheetDraft = {
  speed: "optimized",
  winConditions: ["Combo", "Combat"],
  combos: { present: true, note: "Thoracle" },
  extraTurns: { present: false, note: "" },
  resourceDenial: { present: true, note: "Winter Orb" },
  proxyCount: 3,
  houseRules: "We stop at turn 8.",
};

describe("RuleZeroSheetEditor", () => {
  it("shows the declared fields and says the sheet does not balance the game", () => {
    renderWithIntl(
      <RuleZeroSheetEditor
        initial={DRAFT}
        empty={false}
        saving={false}
        problem={null}
        saved={false}
        onSave={vi.fn()}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "Intended speed" })
    ).toHaveValue("optimized");
    expect(
      screen.getByRole("textbox", { name: "How the deck wins" })
    ).toHaveValue("Combo\nCombat");
    expect(screen.getByRole("textbox", { name: "House rules" })).toHaveValue(
      "We stop at turn 8."
    );
    expect(screen.getByRole("textbox", { name: "Proxy count" })).toHaveValue(
      "3"
    );
    expect(
      screen.getByText(
        "This sheet records what you declared. It does not guarantee a balanced game."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /share/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/bracket/i)).not.toBeInTheDocument();
  });

  it("uses the French catalogue", () => {
    renderWithIntl(
      <RuleZeroSheetEditor
        initial={DRAFT}
        empty={false}
        saving={false}
        problem={null}
        saved={false}
        onSave={vi.fn()}
      />,
      { locale: "fr" }
    );

    expect(
      screen.getByRole("heading", { name: "Feuille de règle 0" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cette feuille enregistre ce que vous avez déclaré. Elle ne garantit pas une partie équilibrée."
      )
    ).toBeInTheDocument();
  });

  it("saves the fields the player declared and refuses a proxy count that is not a number", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderWithIntl(
      <RuleZeroSheetEditor
        initial={DRAFT}
        empty={false}
        saving={false}
        problem={null}
        saved={false}
        onSave={onSave}
      />
    );

    await user.clear(screen.getByRole("textbox", { name: "House rules" }));
    await user.type(
      screen.getByRole("textbox", { name: "House rules" }),
      "No stax."
    );
    await user.click(screen.getByRole("button", { name: "Save sheet" }));

    expect(onSave).toHaveBeenCalledWith({ ...DRAFT, houseRules: "No stax." });

    await user.clear(screen.getByRole("textbox", { name: "Proxy count" }));
    await user.type(
      screen.getByRole("textbox", { name: "Proxy count" }),
      "many"
    );
    await user.click(screen.getByRole("button", { name: "Save sheet" }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(
      "The sheet could not be saved. Check the declared fields."
    );
  });
});
