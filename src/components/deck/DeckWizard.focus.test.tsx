import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckWizard } from "./DeckWizard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

it("does not steal focus when reaching the commander search step", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderWithIntl(<QueryClientProvider client={client}><DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Budget.*50/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(await screen.findByRole("button", { name: "U" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(await screen.findByRole("button", { name: /Fast and aggressive/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(await screen.findByRole("button", { name: /Bracket 3/ }));
  const next = screen.getByRole("button", { name: "Continue" });
  next.focus();
  fireEvent.click(next);
  const search = await screen.findByRole("textbox");
  await waitFor(() => expect(search).toBeVisible());
  expect(search).not.toHaveFocus();
  expect(next).toHaveFocus();
});
