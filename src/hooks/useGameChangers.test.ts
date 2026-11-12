import { describe, it, expect, vi, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { useGameChangersList, useGameChangersSet, useGameChangers } from "./useGameChangers";
import * as scryfallClient from "@/lib/scryfall/client";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderHookWithProviders } from "@/test/render";

vi.mock(import("@/lib/scryfall/client"));

afterEach(() => {
  vi.clearAllMocks();
});

function makeCard(name: string, isGameChanger = false): DeckCard {
  return aDeckCard({ id: name, name, isGameChanger });
}

function makeDeck(cards: DeckCard[], commander: DeckCard | null = null): Deck {
  return aDeck({ name: "Test", commander, cards, targetBracket: 2 });
}

describe("useGameChangersList", () => {
  it("fetches game changers list", async () => {
    const cards = [{ id: "1", name: "Sol Ring" }];
    vi.mocked(scryfallClient.fetchAllPages).mockResolvedValueOnce(
      cards as never
    );

    const { result } = renderHookWithProviders(() => useGameChangersList());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(scryfallClient.fetchAllPages).toHaveBeenCalledWith("is:gamechanger");
  });
});

describe("useGameChangersSet", () => {
  it("returns empty set when data is not loaded", () => {
    vi.mocked(scryfallClient.fetchAllPages).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHookWithProviders(() => useGameChangersSet());
    expect(result.current.gameChangerNames.size).toBe(0);
    expect(result.current.isLoaded).toBe(false);
  });

  it("returns set of game changer names when loaded", async () => {
    const cards = [
      { id: "1", name: "Sol Ring" },
      { id: "2", name: "Mana Crypt" },
    ];
    vi.mocked(scryfallClient.fetchAllPages).mockResolvedValueOnce(
      cards as never
    );

    const { result } = renderHookWithProviders(() => useGameChangersSet());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.gameChangerNames.has("Sol Ring")).toBe(true);
    expect(result.current.isGameChanger("Mana Crypt")).toBe(true);
    expect(result.current.isGameChanger("Lightning Bolt")).toBe(false);
  });
});

describe("useGameChangers", () => {
  it("returns empty array when deck is null", () => {
    vi.mocked(scryfallClient.fetchAllPages).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHookWithProviders(() => useGameChangers(null));
    expect(result.current.gameChangers).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("detects cards flagged as isGameChanger in deck", async () => {
    vi.mocked(scryfallClient.fetchAllPages).mockResolvedValueOnce([] as never);

    const deck = makeDeck([
      makeCard("Sol Ring", true),
      makeCard("Island", false),
    ]);

    const { result } = renderHookWithProviders(() => useGameChangers(deck));

    await waitFor(() => expect(result.current.count).toBeGreaterThan(0));
    expect(result.current.names).toContain("Sol Ring");
    expect(result.current.names).not.toContain("Island");
  });

  it("detects commander as game changer", async () => {
    vi.mocked(scryfallClient.fetchAllPages).mockResolvedValueOnce([] as never);

    const commander = makeCard("Atraxa", true);
    const deck = makeDeck([makeCard("Island")], commander);

    const { result } = renderHookWithProviders(() => useGameChangers(deck));

    await waitFor(() => expect(result.current.count).toBe(1));
    expect(result.current.names).toContain("Atraxa");
  });
});
