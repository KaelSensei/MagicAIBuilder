import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { BlockedSuggestions } from "./BlockedSuggestions";

describe("BlockedSuggestions", () => {
  it("separates hard legality failures from strategic advice", () => {
    renderWithIntl(
      <BlockedSuggestions
        suggestions={[
          {
            name: "Off-color Spell",
            reason: "Strong draw",
            category: "draw",
            priority: "high",
            evidence: {
              role: "draw",
              synergy: "Strong draw",
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
      />
    );

    expect(
      screen.getByRole("region", { name: "Blocked by deck rules" })
    ).toBeInTheDocument();
    expect(screen.getByText("Off-color Spell")).toBeInTheDocument();
    expect(
      screen.getByText("Outside commander color identity")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add off-color spell/i })
    ).not.toBeInTheDocument();
  });
});
