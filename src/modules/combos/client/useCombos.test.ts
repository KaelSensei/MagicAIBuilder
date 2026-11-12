import { describe, it, expect, vi, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { useCombos } from "./useCombos";
import * as spellbook from "@/modules/combos/client/api";
import type { Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderHookWithProviders } from "@/test/render";

vi.mock(import("@/modules/combos/client/api"));

afterEach(() => {
  vi.clearAllMocks();
});

function makeDeck(cardCount: number): Deck {
  return aDeck({
    name: "Test",
    targetBracket: 2,
    cards: Array.from({ length: cardCount }, (_, i) =>
      aDeckCard({ id: `c${i}`, name: `Card${i}` })
    ),
  });
}

describe("useCombos", () => {
  it("does not fetch when deck is null", () => {
    const { result } = renderHookWithProviders(() => useCombos(null));
    expect(result.current.fetchStatus).toBe("idle");
    expect(spellbook.fetchCombosForDeck).not.toHaveBeenCalled();
  });

  it("does not fetch when deck has fewer than 10 cards", () => {
    const deck = makeDeck(9);
    const { result } = renderHookWithProviders(() => useCombos(deck));
    expect(result.current.fetchStatus).toBe("idle");
    expect(spellbook.fetchCombosForDeck).not.toHaveBeenCalled();
  });

  it("fetches when deck has 10 or more cards", async () => {
    const deck = makeDeck(10);
    vi.mocked(spellbook.fetchCombosForDeck).mockResolvedValueOnce([]);

    const { result } = renderHookWithProviders(() => useCombos(deck));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spellbook.fetchCombosForDeck).toHaveBeenCalled();
  });

  it("includes commander in card list", async () => {
    const deck: Deck = {
      ...makeDeck(9),
      commander: aDeckCard({ id: "cmd", name: "Atraxa" }),
    };

    vi.mocked(spellbook.fetchCombosForDeck).mockResolvedValueOnce([]);
    const { result } = renderHookWithProviders(() => useCombos(deck));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledWith = vi.mocked(spellbook.fetchCombosForDeck).mock.calls[0][0];
    expect(calledWith.commanders).toEqual(["Atraxa"]);
    expect(calledWith.main).not.toContain("Atraxa");
  });

  it("does not include non-main cards (considering/maybeboard) in card list", async () => {
    const deck = makeDeck(10);
    deck.cards = [
      ...deck.cards,
      aDeckCard({
        id: "mb-1",
        name: "Food Chain",
        category: "winCondition",
        zone: "maybeboard",
      }),
    ];

    vi.mocked(spellbook.fetchCombosForDeck).mockResolvedValueOnce([]);
    const { result } = renderHookWithProviders(() => useCombos(deck));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledWith = vi.mocked(spellbook.fetchCombosForDeck).mock.calls[0][0];
    expect(calledWith.main).not.toContain("Food Chain");
  });

  it("reports a failed lookup as an error, not as a deck without combos", async () => {
    vi.mocked(spellbook.fetchCombosForDeck).mockRejectedValueOnce(
      new Error("Combo lookup failed with HTTP 502")
    );

    const { result } = renderHookWithProviders(() => useCombos(makeDeck(10)));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
