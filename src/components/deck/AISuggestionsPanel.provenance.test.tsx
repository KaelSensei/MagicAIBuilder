import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import enDeckMessages from "@/messages/en/deck.json";
import frDeckMessages from "@/messages/fr/deck.json";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

describe("AISuggestionsPanel provenance", () => {
  it.each([
    ["en", enDeckMessages, "Evidence type: AI suggestions."],
    ["fr", frDeckMessages, "Type de preuve : suggestions IA."],
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
});
