import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGameChangersList, useGameChangersSet, useGameChangers } from "./useGameChangers";
import * as scryfallClient from "@/lib/scryfall/client";
import type { Deck, DeckCard } from "@/lib/deck/types";

vi.mock("@/lib/scryfall/client");

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

function makeCard(name: string, isGameChanger = false): DeckCard {
  return {
    id: name,
    name,
    quantity: 1,
    category: "other",
    zone: "main",
    isGameChanger,
  } as unknown as DeckCard;
}

function makeDeck(cards: DeckCard[], commander: DeckCard | null = null): Deck {
  return {
    id: "deck-1",
    name: "Test",
    commander,
    partner: null,
    cards,
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

describe("useGameChangersList", () => {
  it("fetches game changers list", async () => {
    const cards = [{ id: "1", name: "Sol Ring" }];
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce({
      data: cards,
      has_more: false,
    } as never);

    const { result } = renderHook(() => useGameChangersList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(scryfallClient.searchCards).toHaveBeenCalledWith("is:gamechanger", 1);
  });
});

describe("useGameChangersSet", () => {
  it("returns empty set when data is not loaded", () => {
    vi.mocked(scryfallClient.searchCards).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHook(() => useGameChangersSet(), {
      wrapper: createWrapper(),
    });
    expect(result.current.gameChangerNames.size).toBe(0);
    expect(result.current.isLoaded).toBe(false);
  });

  it("returns set of game changer names when loaded", async () => {
    const cards = [{ id: "1", name: "Sol Ring" }, { id: "2", name: "Mana Crypt" }];
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce({
      data: cards,
      has_more: false,
    } as never);

    const { result } = renderHook(() => useGameChangersSet(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.gameChangerNames.has("Sol Ring")).toBe(true);
    expect(result.current.isGameChanger("Mana Crypt")).toBe(true);
    expect(result.current.isGameChanger("Lightning Bolt")).toBe(false);
  });
});

describe("useGameChangers", () => {
  it("returns empty array when deck is null", () => {
    vi.mocked(scryfallClient.searchCards).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHook(() => useGameChangers(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.gameChangers).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("detects cards flagged as isGameChanger in deck", async () => {
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce({
      data: [],
      has_more: false,
    } as never);

    const deck = makeDeck([
      makeCard("Sol Ring", true),
      makeCard("Island", false),
    ]);

    const { result } = renderHook(() => useGameChangers(deck), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.count).toBeGreaterThan(0));
    expect(result.current.names).toContain("Sol Ring");
    expect(result.current.names).not.toContain("Island");
  });

  it("detects commander as game changer", async () => {
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce({
      data: [],
      has_more: false,
    } as never);

    const commander = makeCard("Atraxa", true);
    const deck = makeDeck([makeCard("Island")], commander);

    const { result } = renderHook(() => useGameChangers(deck), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.count).toBe(1));
    expect(result.current.names).toContain("Atraxa");
  });
});
