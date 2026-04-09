import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCombos } from "./useCombos";
import * as spellbook from "@/lib/combos/spellbook";
import type { Deck } from "@/lib/deck/types";

vi.mock("@/lib/combos/spellbook");

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }
  return Wrapper;
}

afterEach(() => {
  vi.clearAllMocks();
});

function makeDeck(cardCount: number): Deck {
  return {
    id: "deck-1",
    name: "Test",
    format: "commander",
    commander: null,
    partner: null,
    companion: null,
    cards: Array.from({ length: cardCount }, (_, i) => ({
      id: `c${i}`,
      name: `Card${i}`,
      quantity: 1,
      category: "other",
      zone: "main",
    })),
    cardCount: 0,
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    tags: [],
    pairingType: "none",
    isAIGenerated: false,
    shareEnabled: false,
    isPublic: false,
    shareToken: null,
    description: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  } as unknown as Deck;
}

describe("useCombos", () => {
  it("does not fetch when deck is null", () => {
    const { result } = renderHook(() => useCombos(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(spellbook.fetchCombosForDeck).not.toHaveBeenCalled();
  });

  it("does not fetch when deck has fewer than 10 cards", () => {
    const deck = makeDeck(9);
    const { result } = renderHook(() => useCombos(deck), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(spellbook.fetchCombosForDeck).not.toHaveBeenCalled();
  });

  it("fetches when deck has 10 or more cards", async () => {
    const deck = makeDeck(10);
    vi.mocked(spellbook.fetchCombosForDeck).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCombos(deck), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spellbook.fetchCombosForDeck).toHaveBeenCalled();
  });

  it("includes commander in card list", async () => {
    const deck = {
      ...makeDeck(9),
      commander: { id: "cmd", name: "Atraxa", quantity: 1 },
    } as unknown as Deck;

    vi.mocked(spellbook.fetchCombosForDeck).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useCombos(deck), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledWith = vi.mocked(spellbook.fetchCombosForDeck).mock.calls[0][0];
    expect(calledWith).toContain("Atraxa");
  });

  it("does not include non-main cards (considering/maybeboard) in card list", async () => {
    const deck = makeDeck(10);
    deck.cards = [
      ...deck.cards,
      {
        id: "mb-1",
        name: "Food Chain",
        quantity: 1,
        category: "winCondition",
        zone: "maybeboard",
      } as unknown as Deck["cards"][number],
    ];

    vi.mocked(spellbook.fetchCombosForDeck).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useCombos(deck), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledWith = vi.mocked(spellbook.fetchCombosForDeck).mock.calls[0][0];
    expect(calledWith).not.toContain("Food Chain");
  });
});
