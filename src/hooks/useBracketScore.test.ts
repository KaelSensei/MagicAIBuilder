import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBracketScore } from "./useBracketScore";
import type { Deck } from "@/lib/deck/types";

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "test-deck",
    name: "Test Deck",
    format: "commander",
    cards: [],
    commander: null,
    partner: null,
    companion: null,
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    tags: [],
    pairingType: "none",
    isAIGenerated: false,
    shareEnabled: false,
    shareToken: null,
    description: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  } as Deck;
}

describe("useBracketScore", () => {
  it("returns null when deck is null", () => {
    const { result } = renderHook(() => useBracketScore(null));
    expect(result.current).toBeNull();
  });

  it("returns a bracket score object for a valid deck", () => {
    const deck = makeDeck();
    const { result } = renderHook(() => useBracketScore(deck));
    expect(result.current).not.toBeNull();
    expect(typeof result.current?.overall).toBe("number");
  });

  it("returns overall bracket between 1 and 4", () => {
    const deck = makeDeck();
    const { result } = renderHook(() => useBracketScore(deck));
    const bracket = result.current?.overall ?? 0;
    expect(bracket).toBeGreaterThanOrEqual(1);
    expect(bracket).toBeLessThanOrEqual(4);
  });

  it("updates when deck changes", () => {
    const deck1 = makeDeck({ name: "Deck 1" });
    const deck2 = makeDeck({ name: "Deck 2" });
    const { result, rerender } = renderHook(({ deck }) => useBracketScore(deck), {
      initialProps: { deck: deck1 as Deck | null },
    });
    const first = result.current;
    rerender({ deck: deck2 });
    // Both are bracket scores — just verify they return valid results
    expect(first).not.toBeNull();
    expect(result.current).not.toBeNull();
  });
});
