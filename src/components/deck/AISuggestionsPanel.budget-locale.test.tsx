import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render-with-intl";
import { AISuggestionsPanel } from "./AISuggestionsPanel";

describe("AISuggestionsPanel budget options", () => {
  it("labels USD limits in the active locale without changing their values", () => {
    renderWithIntl(
      <AISuggestionsPanel
        result={null}
        isLoading={false}
        error={null}
        onAnalyze={vi.fn()}
        onAddCard={vi.fn()}
        onRemoveCard={vi.fn()}
        onBudgetPerCardChange={vi.fn()}
      />,
      { locale: "fr" }
    );

    expect(screen.getByRole("button", { name: "Sans limite" })).toBeInTheDocument();
    const formattedUsd = new Intl.NumberFormat("fr", { style: "currency", currency: "USD" }).format(5);
    expect(screen.getByRole("button", { name: `< ${formattedUsd}` })).toBeInTheDocument();
  });
});
