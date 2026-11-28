/**
 * I-02 slice 2: every sentence the model writes in the suggestions panel is
 * tagged as model reasoning, on the sentence itself, in words rather than
 * colour alone, and never with the checked tag the card-data facts carry.
 */
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AISuggestionResult } from "@/hooks/useAISuggestions";
import type { SuggestionEvidence } from "@/lib/ai/suggestion-evidence";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

const SOL_RING_EVIDENCE: SuggestionEvidence = {
  verified: true,
  role: "ramp",
  synergy: "ramp",
  manaValue: 1,
  curve: { position: "below", deckAverage: 3 },
  colorIdentity: [],
  colorCompatible: true,
  commanderLegal: true,
  priceUsd: 1.5,
};

function renderPanel(result: AISuggestionResult, locale: TestLocale = "en") {
  return renderWithIntl(
    <AISuggestionsPanel
      result={result}
      isLoading={false}
      error={null}
      onAnalyze={vi.fn()}
      onAddCard={vi.fn()}
      onRemoveCard={vi.fn()}
    />,
    { locale }
  );
}

function aResult(overrides: Partial<AISuggestionResult>): AISuggestionResult {
  return {
    suggestions: [],
    removals: [],
    analysis: "",
    provider: "anthropic",
    ...overrides,
  };
}

describe("AISuggestionsPanel model reasoning tag", () => {
  it("tags a suggested card's sentence as model reasoning, never with the checked tag of its card-data facts", () => {
    renderPanel(
      aResult({
        suggestions: [
          {
            name: "Sol Ring",
            reason: "Accelerates the commander by two turns.",
            category: "ramp",
            priority: "high",
            evidence: SOL_RING_EVIDENCE,
          },
        ],
      })
    );

    const sentence = screen.getByText("Accelerates the commander by two turns.");
    expect(within(sentence).getByText("Model reasoning")).toBeInTheDocument();
    expect(within(sentence).queryByText("Scryfall verified")).toBeNull();
    expect(screen.getByText("Scryfall verified")).toBeInTheDocument();
  });

  it("words the tag in the player's language", () => {
    renderPanel(
      aResult({
        suggestions: [
          {
            name: "Sol Ring",
            reason: "Accélère le commandant de deux tours.",
            category: "ramp",
            priority: "high",
          },
        ],
      }),
      "fr"
    );

    const sentence = screen.getByText("Accélère le commandant de deux tours.");
    expect(
      within(sentence).getByText("Raisonnement du modèle")
    ).toBeInTheDocument();
  });

  it("tags an alternative's sentence as model reasoning", () => {
    renderPanel(
      aResult({
        suggestions: [
          {
            name: "Sol Ring",
            reason: "Accelerates the commander by two turns.",
            category: "ramp",
            priority: "high",
            alternatives: [
              {
                name: "Mind Stone",
                reason: "Cheaper ramp that draws a card later.",
                dimension: "budget",
              },
            ],
          },
        ],
      })
    );

    const sentence = screen.getByText("Cheaper ramp that draws a card later.");
    expect(within(sentence).getByText("Model reasoning")).toBeInTheDocument();
  });

  it("tags the sentence on a suggested cut as model reasoning", () => {
    renderPanel(
      aResult({
        removals: [
          {
            name: "Darksteel Ingot",
            reason: "Too slow for a deck that wants to cast its commander early.",
          },
        ],
      })
    );

    const sentence = screen.getByText(
      "Too slow for a deck that wants to cast its commander early."
    );
    expect(within(sentence).getByText("Model reasoning")).toBeInTheDocument();
  });

  it("shows no tag when the model wrote no sentence for a card", () => {
    renderPanel(
      aResult({
        suggestions: [
          { name: "Sol Ring", reason: "  ", category: "ramp", priority: "high" },
        ],
      })
    );

    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(screen.queryByText("Model reasoning")).toBeNull();
  });
});
