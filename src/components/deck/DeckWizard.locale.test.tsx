import { fireEvent, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckWizard } from "./DeckWizard";

it("shows translated budget choices in the French deck wizard", () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderWithIntl(
    <QueryClientProvider client={client}>
      <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
    </QueryClientProvider>,
    { locale: "fr" }
  );

  expect(screen.getByRole("button", { name: "Modéré 50 $ – 200 $" })).toBeInTheDocument();
});

it("names color choices in French for assistive technology", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderWithIntl(
    <QueryClientProvider client={client}>
      <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
    </QueryClientProvider>,
    { locale: "fr" }
  );

  fireEvent.click(screen.getByRole("button", { name: "Budget < 50 $" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(await screen.findByRole("button", { name: "Bleu" })).toBeInTheDocument();
});

it("shows translated strategy choices in the French deck wizard", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderWithIntl(
    <QueryClientProvider client={client}>
      <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
    </QueryClientProvider>,
    { locale: "fr" }
  );

  fireEvent.click(screen.getByRole("button", { name: "Budget < 50 $" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  fireEvent.click(await screen.findByRole("button", { name: "Bleu" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(await screen.findByRole("button", { name: /Contrôle Contrer et contrôler/ })).toBeInTheDocument();
});

it("shows the translated bracket description in the French deck wizard", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderWithIntl(
    <QueryClientProvider client={client}>
      <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
    </QueryClientProvider>,
    { locale: "fr" }
  );

  fireEvent.click(screen.getByRole("button", { name: "Budget < 50 $" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  fireEvent.click(await screen.findByRole("button", { name: "Bleu" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  fireEvent.click(await screen.findByRole("button", { name: /Contrôle Contrer et contrôler/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  expect(await screen.findByRole("button", { name: /Optimisé Synergies optimisées/ })).toBeInTheDocument();
});
