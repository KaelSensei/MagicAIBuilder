import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { describe, expect, it } from "vitest";

import { SuggestionEvidenceDetails } from "./SuggestionEvidenceDetails";

describe("SuggestionEvidenceDetails", () => {
  it("shows a localized role for a French suggestion", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "draw",
          synergy: "Accelerates the commander.",
          manaValue: 2,
          curveImpact: "Below the deck average (3.40)",
          colorIdentity: [],
          colorCompatible: true,
          commanderLegal: true,
          priceUsd: 1.25,
          verified: true,
        }}
      />,
      { locale: "fr" }
    );

    expect(screen.getByText("Pioche")).toBeInTheDocument();
  });

  it("formats a Scryfall USD price for French without converting it to euros", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "ramp",
          synergy: "Acceleration.",
          manaValue: 2,
          curveImpact: "Below average",
          colorIdentity: [],
          colorCompatible: true,
          commanderLegal: true,
          priceUsd: 1234.5,
          verified: true,
        }}
      />,
      { locale: "fr" }
    );

    expect(
      screen.getByText(
        new Intl.NumberFormat("fr", { style: "currency", currency: "USD" }).format(1234.5),
        { normalizer: (value) => value.trim() }
      )
    ).toBeInTheDocument();
  });

  it("shows verified legality, colors, curve and price", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "ramp",
          synergy: "Accelerates the commander.",
          manaValue: 2,
          curveImpact: "Below the deck average (3.40)",
          colorIdentity: [],
          colorCompatible: true,
          commanderLegal: true,
          priceUsd: 1.25,
          verified: true,
        }}
      />
    );

    expect(screen.getByText("Scryfall verified")).toBeInTheDocument();
    expect(screen.getByText("Ramp")).toBeInTheDocument();
    expect(screen.getByText("Colorless · compatible")).toBeInTheDocument();
    expect(screen.getByText("Commander legal")).toBeInTheDocument();
    expect(screen.getByText("$1.25")).toBeInTheDocument();
    expect(
      screen.getByText(/MV 2 · Below the deck average/)
    ).toBeInTheDocument();
  });

  it("does not claim facts when Scryfall verification is unavailable", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "draw",
          synergy: "Provider rationale.",
          manaValue: null,
          curveImpact: "Mana value unavailable",
          colorIdentity: [],
          colorCompatible: null,
          commanderLegal: null,
          priceUsd: null,
          verified: false,
        }}
      />
    );

    expect(screen.getByText("Verification unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown")).toHaveLength(3);
  });
});
