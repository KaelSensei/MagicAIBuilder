import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

describe("AISuggestionsPanel provenance", () => {
  it.each<[TestLocale, string]>([
    ["en", "AI suggestions"],
    ["fr", "suggestions IA"],
  ])("labels generated suggestions in %s", (locale, label) => {
    renderWithIntl(
      <AISuggestionsPanel
        result={{
          suggestions: [
            {
              name: "Sol Ring",
              reason: "Helps ramp.",
              category: "ramp",
              priority: "high",
            },
          ],
          removals: [],
          analysis: "",
          provider: "mock",
        }}
        isLoading={false}
        error={null}
        onAnalyze={vi.fn()}
        onAddCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />,
      { locale }
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("discloses the provider, exact observation time and analyzed deck snapshot", () => {
    renderWithIntl(
      <AISuggestionsPanel
        result={{
          suggestions: [
            {
              name: "Sol Ring",
              reason: "Helps ramp.",
              category: "ramp",
              priority: "high",
            },
          ],
          removals: [],
          analysis: "",
          provider: "openai",
        }}
        isLoading={false}
        error={null}
        onAnalyze={vi.fn()}
        onAddCard={vi.fn()}
        onRemoveCard={vi.fn()}
        analysedAt={new Date("2026-11-02T10:30:00.000Z")}
        currentCardNames={["Sol Ring", "Arcane Signet"]}
      />
    );

    expect(screen.getByText("Source: OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Observed: Nov 2, 2026, 10:30 AM")).toBeInTheDocument();
    expect(screen.getByText("Deck snapshot: 2 cards")).toBeInTheDocument();
  });
});
