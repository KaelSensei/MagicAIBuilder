import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import deckMessages from "@/messages/en/deck.json";
import { ImportDialog } from "./ImportDialog";

const addCard = vi.hoisted(() => vi.fn());
const fetchInBatches = vi.hoisted(() => vi.fn());

vi.mock("@/lib/deck/batch-fetch", () => ({ fetchInBatches }));
vi.mock("@/lib/deck/store", () => ({
  useDeckStore: (select: (state: object) => unknown) => select({
    activeDeckId: "deck-1",
    addCard,
    setCommander: vi.fn(),
    setPartner: vi.fn(),
    setCompanion: vi.fn(),
  }),
}));
vi.mock("@/components/deck/ImportFromUrlTab", () => ({
  ImportFromUrlTab: () => null,
}));

beforeEach(() => {
  addCard.mockClear();
  fetchInBatches.mockReset();
});

it("previews a pasted list before adding cards", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <ImportDialog open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>
  );

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n2 Sol Ring\n\nSideboard\n1 Negate" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Commanders: Atraxa, Praetors' Voice")).toBeInTheDocument();
  expect(screen.getByText("Main 2 · Sideboard 1 · Maybeboard 0")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import this preview" })).toBeInTheDocument();
  expect(fetchInBatches).toHaveBeenCalledOnce();
  expect(addCard).not.toHaveBeenCalled();
});

it("discards a stale preview when the pasted list changes", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <ImportDialog open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>
  );

  const input = screen.getByPlaceholderText(/Atraxa, Praetors' Voice/);
  fireEvent.change(input, { target: { value: "1 Sol Ring" } });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  expect(await screen.findByRole("button", { name: "Import this preview" })).toBeInTheDocument();

  fireEvent.change(input, { target: { value: "1 Arcane Signet" } });
  expect(screen.queryByRole("button", { name: "Import this preview" })).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Preview decklist" })).toBeInTheDocument();
});

it("reuses preview validation when the player confirms the import", async () => {
  fetchInBatches.mockResolvedValueOnce([]);
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <ImportDialog open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>
  );

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  expect(await screen.findByRole("button", { name: "Import this preview" })).toBeInTheDocument();
  expect(fetchInBatches).toHaveBeenCalledWith([{ name: "Sol Ring" }]);

  fireEvent.click(screen.getByRole("button", { name: "Import this preview" }));
  await waitFor(() => expect(screen.getByText("Successfully imported 0 cards.")).toBeInTheDocument());
  expect(fetchInBatches).toHaveBeenCalledOnce();
});

it("shows unresolved names before confirmation without changing the deck", async () => {
  fetchInBatches.mockResolvedValueOnce([{ name: "Sol Ring" }]);
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <ImportDialog open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>
  );

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring\n1 Definitely Not A Card" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(await screen.findByText("Definitely Not A Card")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Cards not found in Scryfall (1):");
  expect(addCard).not.toHaveBeenCalled();
});

it("ignores a validation result that arrives after the dialog closes", async () => {
  let finishValidation: ((cards: { name: string }[]) => void) | undefined;
  fetchInBatches.mockReturnValueOnce(new Promise((resolve) => {
    finishValidation = resolve;
  }));

  function DialogHarness() {
    const [open, setOpen] = useState(true);
    return (
      <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
        <button type="button" onClick={() => setOpen(true)}>Open import</button>
        <ImportDialog open={open} onOpenChange={setOpen} />
      </NextIntlClientProvider>
    );
  }

  render(<DialogHarness />);
  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    finishValidation?.([{ name: "Sol Ring" }]);
  });
  fireEvent.click(screen.getByRole("button", { name: "Open import" }));

  expect(screen.queryByRole("button", { name: "Import this preview" })).not.toBeInTheDocument();
});
