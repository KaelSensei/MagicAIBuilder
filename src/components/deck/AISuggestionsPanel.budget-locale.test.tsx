import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import frDeckMessages from "@/messages/fr/deck.json";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

describe("AISuggestionsPanel budget options", () => {
  it("labels USD limits in the active locale without changing their values", () => {
    render(
      <NextIntlClientProvider locale="fr" messages={{ deck: frDeckMessages }}>
        <AISuggestionsPanel
          result={null}
          isLoading={false}
          error={null}
          onAnalyze={vi.fn()}
          onAddCard={vi.fn()}
          onRemoveCard={vi.fn()}
          onBudgetPerCardChange={vi.fn()}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("button", { name: "Sans limite" })).toBeInTheDocument();
    const formattedUsd = new Intl.NumberFormat("fr", { style: "currency", currency: "USD" }).format(5);
    expect(screen.getByRole("button", { name: `< ${formattedUsd}` })).toBeInTheDocument();
  });
});
