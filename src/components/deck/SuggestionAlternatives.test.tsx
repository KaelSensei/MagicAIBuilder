import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render-with-intl";
import { SuggestionAlternatives } from "./SuggestionAlternatives";

describe("SuggestionAlternatives", () => {
  it("labels the tradeoff and lets the player choose an alternative", () => {
    const onAdd = vi.fn();
    renderWithIntl(
      <SuggestionAlternatives
        alternatives={[
          {
            name: "Fellwar Stone",
            reason: "A cheaper mana rock.",
            dimension: "budget",
          },
        ]}
        addedCards={new Set()}
        onAdd={onAdd}
      />
    );

    expect(screen.getByText("1 alternative")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Fellwar Stone" }));
    expect(onAdd).toHaveBeenCalledWith("Fellwar Stone");
  });

  it("disables alternatives with a verified legality failure", () => {
    const onAdd = vi.fn();
    renderWithIntl(
      <SuggestionAlternatives
        alternatives={[
          {
            name: "Off-color Stone",
            reason: "Wrong color.",
            dimension: "power",
            evidence: {
              role: "ramp",
              synergy: "Wrong color",
              manaValue: 2,
              curveImpact: "Below average",
              colorIdentity: ["R"],
              colorCompatible: false,
              commanderLegal: true,
              priceUsd: 1,
              verified: true,
            },
          },
        ]}
        addedCards={new Set()}
        onAdd={onAdd}
      />
    );

    const button = screen.getByRole("button", {
      name: /cannot add off-color stone/i,
    });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onAdd).not.toHaveBeenCalled();
  });
});
