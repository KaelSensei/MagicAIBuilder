import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DeckWizard } from "./DeckWizard";

function renderFrenchWizard() {
  renderWithProviders(
    <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />,
    { locale: "fr" }
  );
}

async function openColorStep() {
  fireEvent.click(screen.getByRole("button", { name: "Budget < 50 $" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  return screen.findByRole("button", { name: "Bleu" });
}

async function openStrategyStep() {
  fireEvent.click(await openColorStep());
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  return screen.findByRole("button", { name: /Contrôle Contrer et contrôler/ });
}

it("shows translated budget choices in the French deck wizard", () => {
  renderFrenchWizard();
  expect(screen.getByRole("button", { name: "Modéré 50 $ – 200 $" })).toBeInTheDocument();
});

it("names color choices in French for assistive technology", async () => {
  renderFrenchWizard();
  expect(await openColorStep()).toBeInTheDocument();
});

it("shows translated strategy choices in the French deck wizard", async () => {
  renderFrenchWizard();
  expect(await openStrategyStep()).toBeInTheDocument();
});

it("shows the translated bracket description in the French deck wizard", async () => {
  renderFrenchWizard();
  fireEvent.click(await openStrategyStep());
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(
    await screen.findByRole("button", { name: /Amélioré \(bracket 3\) Synergies fortes/ })
  ).toBeInTheDocument();
});
