import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders } from "@/test/render";
import { DeckPriceDisplay } from "./DeckPriceDisplay";

function openDeckWith(cards: DeckCard[]) {
  const deck = aDeck({ cards });
  useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
}

function rowFor(label: string): HTMLElement {
  const row = screen.getByText(label).closest("div")?.parentElement;
  if (!row) throw new Error(`no row for ${label}`);
  return row;
}

describe("DeckPriceDisplay", () => {
  beforeEach(() => {
    // The store persists through fetch; nothing here reaches the network.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useDeckStore.setState({ decks: {}, activeDeckId: null });
  });

  it("shows the total without basic lands under the total value", () => {
    openDeckWith([
      aDeckCard({ id: "staples", typeLine: "Artifact", price: 403.5 }),
      aDeckCard({
        id: "forests",
        typeLine: "Basic Land — Forest",
        price: 0.3,
        quantity: 30,
      }),
    ]);

    renderWithProviders(<DeckPriceDisplay />);

    expect(rowFor("Total value")).toHaveTextContent(/USD\s412\.50/);
    expect(rowFor("Without basic lands")).toHaveTextContent(/USD\s403\.50/);
  });

  it("shows no second line when the deck holds no basic land", () => {
    openDeckWith([aDeckCard({ id: "sol", typeLine: "Artifact", price: 2 })]);

    renderWithProviders(<DeckPriceDisplay />);

    expect(screen.getByText("Total value")).toBeInTheDocument();
    expect(screen.queryByText("Without basic lands")).not.toBeInTheDocument();
  });

  it("leaves out Snow-Covered Forest but keeps Dryad Arbor (CR 205.4c)", () => {
    openDeckWith([
      aDeckCard({ id: "snow", typeLine: "Basic Snow Land — Forest", price: 1 }),
      aDeckCard({
        id: "arbor",
        typeLine: "Land Creature — Forest Dryad",
        price: 20,
      }),
      aDeckCard({ id: "sol", typeLine: "Artifact", price: 5 }),
    ]);

    renderWithProviders(<DeckPriceDisplay />);

    expect(rowFor("Total value")).toHaveTextContent(/USD\s26\.00/);
    expect(rowFor("Without basic lands")).toHaveTextContent(/USD\s25\.00/);
  });

  it("writes the second line in French", () => {
    openDeckWith([
      aDeckCard({ id: "sol", typeLine: "Artifact", price: 5 }),
      aDeckCard({ id: "island", typeLine: "Basic Land — Island", price: 0.5 }),
    ]);

    renderWithProviders(<DeckPriceDisplay />, { locale: "fr" });

    expect(rowFor("Sans les terrains de base")).toHaveTextContent(/5,00\s*USD/);
  });
});
