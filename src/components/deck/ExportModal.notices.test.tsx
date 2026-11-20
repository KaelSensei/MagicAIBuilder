/**
 * The export dialog names what each target leaves out or moves before the
 * player copies or downloads (I-50 requirement 1.2).
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders } from "@/test/render";
import type { Deck } from "@/lib/deck/types";
import { ExportModal } from "./ExportModal";

const DECK: Deck = aDeck({
  name: "Atraxa Superfriends",
  commander: aDeckCard({ id: "cmd", name: "Atraxa, Praetors' Voice" }),
  cards: [
    aDeckCard({ id: "c1", name: "Sol Ring" }),
    aDeckCard({ id: "c2", name: "Negate", quantity: 2, zone: "sideboard" }),
    aDeckCard({ id: "c3", name: "Counterspell", zone: "maybeboard" }),
  ],
});

/** The items of the notice list a target's summary opens. */
async function openNotices(summary: string): Promise<string[]> {
  const user = userEvent.setup();
  await user.click(screen.getByText(summary));
  const list = screen.getByRole("list", { name: summary });
  return within(list)
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "");
}

describe("ExportModal notices", () => {
  it("lists the Sideboard and Considering cards TappedOut leaves out", async () => {
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />);

    expect(await openNotices("TappedOut leaves out 3 cards")).toEqual([
      "2 Negate (Sideboard)",
      "1 Counterspell (Considering)",
    ]);
  });

  it("lists the commander MTGO writes into its main deck", async () => {
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />);

    expect(await openNotices("MTGO moves 1 card into its main deck")).toEqual([
      "1 Atraxa, Praetors' Voice (Command zone)",
    ]);
  });

  it("shows no notice for a target that keeps every card", () => {
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />);

    expect(screen.queryByText(/^Moxfield leaves out/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Plain Text leaves out/)
    ).not.toBeInTheDocument();
  });

  it("names what TappedOut leaves out in French", async () => {
    renderWithProviders(<ExportModal deck={DECK} onClose={vi.fn()} />, {
      locale: "fr",
    });

    expect(await openNotices("TappedOut n’exporte pas 3 cartes")).toEqual([
      "2 Negate (Réserve)",
      "1 Counterspell (À considérer)",
    ]);
  });
});
