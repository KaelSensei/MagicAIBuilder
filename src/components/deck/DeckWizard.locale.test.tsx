import { screen } from "@testing-library/react";
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
