import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DeckWizard } from "./DeckWizard";

it("does not steal focus when reaching the commander search step", async () => {
  renderWithProviders(
    <DeckWizard open onClose={vi.fn()} onComplete={vi.fn()} />
  );
  fireEvent.click(screen.getByRole("button", { name: /Budget.*50/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(await screen.findByRole("button", { name: "Blue" }));
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
