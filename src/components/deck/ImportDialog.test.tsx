import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
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

it("previews a pasted list before fetching or adding cards", () => {
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <ImportDialog open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>
  );

  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n2 Sol Ring\n\nSideboard\n1 Negate" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));

  expect(screen.getByText("Commanders: Atraxa, Praetors' Voice")).toBeInTheDocument();
  expect(screen.getByText("Main 2 · Sideboard 1 · Maybeboard 0")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import this preview" })).toBeInTheDocument();
  expect(fetchInBatches).not.toHaveBeenCalled();
  expect(addCard).not.toHaveBeenCalled();
});

it("discards a stale preview when the pasted list changes", () => {
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <ImportDialog open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>
  );

  const input = screen.getByPlaceholderText(/Atraxa, Praetors' Voice/);
  fireEvent.change(input, { target: { value: "1 Sol Ring" } });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
  expect(screen.getByRole("button", { name: "Import this preview" })).toBeInTheDocument();

  fireEvent.change(input, { target: { value: "1 Arcane Signet" } });
  expect(screen.queryByRole("button", { name: "Import this preview" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Preview decklist" })).toBeInTheDocument();
});

it("validates names only after the player confirms the preview", async () => {
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
  expect(fetchInBatches).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Import this preview" }));
  await waitFor(() => expect(fetchInBatches).toHaveBeenCalledWith([{ name: "Sol Ring" }]));
});
