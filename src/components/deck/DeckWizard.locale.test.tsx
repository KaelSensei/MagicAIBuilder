import { fireEvent, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckWizard } from "./DeckWizard";

function renderFrenchWizard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderWithIntl(
    <QueryClientProvider client={client}>
      <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
    </QueryClientProvider>,
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
  expect(await screen.findByRole("button", { name: /Optimisé Synergies optimisées/ })).toBeInTheDocument();
});
