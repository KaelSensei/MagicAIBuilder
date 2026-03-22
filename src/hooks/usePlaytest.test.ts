import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlaytest } from "./usePlaytest";
import type { Deck, DeckCard } from "@/lib/deck/types";

function makeCard(name: string): DeckCard {
  return {
    id: name,
    scryfallId: name,
    name,
    quantity: 1,
    category: "other",
    zone: "main",
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
  } as unknown as DeckCard;
}

function makeDeck(cardCount = 20): Deck {
  return {
    id: "deck-1",
    name: "Test",
    format: "commander",
    commander: null,
    partner: null,
    companion: null,
    cards: Array.from({ length: cardCount }, (_, i) => makeCard(`Card${i}`)),
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
  } as unknown as Deck;
}

describe("usePlaytest", () => {
  it("starts with null state", () => {
    const { result } = renderHook(() => usePlaytest());
    expect(result.current.state).toBeNull();
  });

  it("startPlaytest draws 7 cards", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());

    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });

    expect(state!.hand).toHaveLength(7);
    expect(state!.library).toHaveLength(13);
    expect(state!.turn).toBe(1);
    expect(state!.mulliganCount).toBe(0);
  });

  it("startPlaytest sets state", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    act(() => { result.current.startPlaytest(deck); });
    expect(result.current.state).not.toBeNull();
    expect(result.current.state?.hand).toHaveLength(7);
  });

  it("startPlaytest includes commander in card pool", () => {
    const deck = {
      ...makeDeck(18),
      commander: makeCard("Atraxa"),
    } as unknown as Deck;
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    // 19 cards total (18 + commander), draw 7, library 12
    expect(state!.hand.length + state!.library.length).toBe(19);
  });

  it("mulligan decrements hand size by 1", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    act(() => { state = result.current.mulligan(state, deck); });
    expect(state!.hand).toHaveLength(6); // 7 - 1 = 6
    expect(state!.mulliganCount).toBe(1);
  });

  it("mulligan keeps track of count", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    act(() => { state = result.current.mulligan(state, deck); });
    act(() => { state = result.current.mulligan(state, deck); });
    expect(state!.mulliganCount).toBe(2);
    expect(state!.hand).toHaveLength(5);
  });

  it("drawCard moves top card from library to hand", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    const librarySize = state!.library.length;
    act(() => { state = result.current.drawCard(state); });
    expect(state!.hand).toHaveLength(8);
    expect(state!.library).toHaveLength(librarySize - 1);
  });

  it("drawCard returns current state when library is empty", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    // Empty the library
    const emptyLibraryState = { ...state, library: [] };
    let newState: typeof state;
    act(() => { newState = result.current.drawCard(emptyLibraryState); });
    expect(newState!).toBe(emptyLibraryState);
  });

  it("nextTurn increments turn counter", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    act(() => { state = result.current.nextTurn(state); });
    expect(state!.turn).toBe(2);
  });

  it("nextTurn draws a card", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    const librarySize = state!.library.length;
    act(() => { state = result.current.nextTurn(state); });
    expect(state!.hand).toHaveLength(8);
    expect(state!.library).toHaveLength(librarySize - 1);
  });

  it("nextTurn with empty library only increments turn", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    let state: ReturnType<typeof result.current.startPlaytest>;
    act(() => { state = result.current.startPlaytest(deck); });
    const emptyLibraryState = { ...state, library: [] };
    act(() => { state = result.current.nextTurn(emptyLibraryState); });
    expect(state!.turn).toBe(2);
    expect(state!.hand).toHaveLength(emptyLibraryState.hand.length);
  });

  it("stopPlaytest resets state to null", () => {
    const deck = makeDeck(20);
    const { result } = renderHook(() => usePlaytest());
    act(() => { result.current.startPlaytest(deck); });
    act(() => { result.current.stopPlaytest(); });
    expect(result.current.state).toBeNull();
  });
});
