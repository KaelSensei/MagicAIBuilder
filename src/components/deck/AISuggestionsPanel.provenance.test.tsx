import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import enDeckMessages from "@/messages/en/deck.json";
import frDeckMessages from "@/messages/fr/deck.json";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

describe("AISuggestionsPanel provenance", () => {
  it.each([
    ["en", enDeckMessages, "AI suggestions"],
    ["fr", frDeckMessages, "suggestions IA"],
  ])("labels generated suggestions in %s", (locale, deck, label) => {
    render(
      <NextIntlClientProvider locale={locale} messages={{ deck }}>
        <AISuggestionsPanel
          result={{
            suggestions: [{ name: "Sol Ring", reason: "Helps ramp.", category: "ramp", priority: "high" }],
            removals: [],
            analysis: "",
            provider: "mock",
          }}
          isLoading={false}
          error={null}
          onAnalyze={vi.fn()}
          onAddCard={vi.fn()}
          onRemoveCard={vi.fn()}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("discloses the provider, exact observation time and analyzed deck snapshot", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ deck: enDeckMessages }}>
        <AISuggestionsPanel
          result={{
            suggestions: [{ name: "Sol Ring", reason: "Helps ramp.", category: "ramp", priority: "high" }],
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
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Source: OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Observed: Nov 2, 2026, 10:30 AM")).toBeInTheDocument();
    expect(screen.getByText("Deck snapshot: 2 cards")).toBeInTheDocument();
  });
});
