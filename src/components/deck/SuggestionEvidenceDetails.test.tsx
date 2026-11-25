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
          curve: { position: "below", deckAverage: 3.4 },
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

  it("reads a found card's curve position in French, with French number format", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "draw",
          synergy: "Draws cards.",
          manaValue: 3,
          curve: { position: "below", deckAverage: 3.45 },
          colorIdentity: [],
          colorCompatible: true,
          commanderLegal: true,
          priceUsd: 1.25,
          verified: true,
        }}
      />,
      { locale: "fr" }
    );

    expect(
      screen.getByText("Valeur de mana 3 · sous la moyenne du deck (3,45)")
    ).toBeInTheDocument();
  });

  it("formats a Scryfall USD price for French without converting it to euros", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "ramp",
          synergy: "Acceleration.",
          manaValue: 2,
          curve: { position: "below", deckAverage: 3.4 },
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
          curve: { position: "below", deckAverage: 3.4 },
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
      screen.getByText("Mana value 2 · below the deck average (3.40)")
    ).toBeInTheDocument();
  });

  it("words a card above the deck average in English, with two decimals", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "winCondition",
          synergy: "Ends the game.",
          manaValue: 7,
          curve: { position: "above", deckAverage: 3 },
          colorIdentity: [],
          colorCompatible: true,
          commanderLegal: true,
          priceUsd: 4,
          verified: true,
        }}
      />
    );

    expect(
      screen.getByText("Mana value 7 · above the deck average (3.00)")
    ).toBeInTheDocument();
  });

  it("words a card near the deck average in French", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "removal",
          synergy: "Answers a threat.",
          manaValue: 0.5,
          curve: { position: "near", deckAverage: 0.6 },
          colorIdentity: [],
          colorCompatible: true,
          commanderLegal: true,
          priceUsd: 1,
          verified: true,
        }}
      />,
      { locale: "fr" }
    );

    expect(
      screen.getByText(
        "Valeur de mana 0,5 · proche de la moyenne du deck (0,60)"
      )
    ).toBeInTheDocument();
  });

  it("says the mana value is unknown in French when the card was not found", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "draw",
          synergy: "Provider rationale.",
          manaValue: null,
          curve: null,
          colorIdentity: [],
          colorCompatible: null,
          commanderLegal: null,
          priceUsd: null,
          verified: false,
        }}
      />,
      { locale: "fr" }
    );

    expect(screen.getByText("Valeur de mana inconnue")).toBeInTheDocument();
  });

  it("does not claim facts when Scryfall verification is unavailable", () => {
    renderWithIntl(
      <SuggestionEvidenceDetails
        evidence={{
          role: "draw",
          synergy: "Provider rationale.",
          manaValue: null,
          curve: null,
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
    expect(screen.getByText("Mana value unknown")).toBeInTheDocument();
  });
});
