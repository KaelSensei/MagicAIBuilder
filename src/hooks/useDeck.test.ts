import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDeck } from "./useDeck";
import { useDeckStore } from "@/lib/deck/store";

// Test useDeck hook which wraps the Zustand store
describe("useDeck", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null deck when no active deck is set", () => {
    // Reset store state
    useDeckStore.setState({ decks: {}, activeDeckId: null });
    const { result } = renderHook(() => useDeck());
    expect(result.current.deck).toBeNull();
    expect(result.current.stats).toBeNull();
  });

  it("exposes deck actions", () => {
    useDeckStore.setState({ decks: {}, activeDeckId: null });
    const { result } = renderHook(() => useDeck());
    expect(typeof result.current.createDeck).toBe("function");
    expect(typeof result.current.deleteDeck).toBe("function");
    expect(typeof result.current.renameDeck).toBe("function");
    expect(typeof result.current.setActiveDeck).toBe("function");
    expect(typeof result.current.setCommander).toBe("function");
    expect(typeof result.current.setCompanion).toBe("function");
    expect(typeof result.current.addCard).toBe("function");
    expect(typeof result.current.removeCard).toBe("function");
    expect(typeof result.current.updateCardCategory).toBe("function");
    expect(typeof result.current.setTargetBracket).toBe("function");
    expect(typeof result.current.setBudget).toBe("function");
  });

  it("returns decks list", () => {
    useDeckStore.setState({ decks: {}, activeDeckId: null });
    const { result } = renderHook(() => useDeck());
    expect(Array.isArray(result.current.decks)).toBe(true);
  });

  it("returns stats when active deck exists", () => {
    const testDeck = {
      id: "deck-1",
      name: "Test",
      format: "commander" as const,
      commander: null,
      partner: null,
      companion: null,
      cards: [],
      cardCount: 0,
      targetBracket: 2 as 1 | 2 | 3 | 4,
      manualBracket: null,
      budget: null,
      tags: [],
      pairingType: "none" as const,
      isAIGenerated: false,
      shareEnabled: false,
    isPublic: false,
      shareToken: null,
      description: "",
      maybeboard: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    useDeckStore.setState({ decks: { "deck-1": testDeck }, activeDeckId: "deck-1" });
    const { result } = renderHook(() => useDeck());
    expect(result.current.deck).not.toBeNull();
    expect(result.current.stats).not.toBeNull();
  });
});
