import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import deckMessages from "@/messages/en/deck.json";
import { SuggestionEvidenceDetails } from "./SuggestionEvidenceDetails";

describe("SuggestionEvidenceDetails", () => {
  it("shows verified legality, colors, curve and price", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
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
      </NextIntlClientProvider>
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
    render(
      <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
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
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Verification unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown")).toHaveLength(3);
  });
});
