import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DeckWizard } from "./DeckWizard";

function renderWizard() {
  renderWithProviders(
    <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
  );
}

describe("DeckWizard budget step", () => {
  it("does not show the $50 budget as selected before a choice", () => {
    renderWizard();

    const budget = screen.getByRole("button", { name: "Budget < $50" });
    expect(budget.className).not.toContain("bg-[var(--accent)]/10");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.click(budget);

    expect(budget.className).toContain("bg-[var(--accent)]/10");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
