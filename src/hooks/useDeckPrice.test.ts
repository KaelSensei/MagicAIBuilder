import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDeckPrice } from "./useDeckPrice";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard, Deck } from "@/lib/deck/types";

// Minimal DeckCard factory for tests
function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: `card-${Math.random()}`,
    name: "Test Card",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

function makeEmptyDeck(id = "deck-1"): Deck {
  return {
    id,
    name: "Test Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("useDeckPrice", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns zeros when no active deck is set", () => {
    useDeckStore.setState({ decks: {}, activeDeckId: null });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalPrice).toBe(0);
    expect(result.current.missingPriceCount).toBe(0);
    expect(result.current.hasCards).toBe(false);
  });

  it("returns zero totalPrice for empty deck", () => {
    const deck = makeEmptyDeck();
    useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalPrice).toBe(0);
    expect(result.current.hasCards).toBe(false);
  });

  it("sums prices across all main-deck cards", () => {
    const deck = makeEmptyDeck();
    deck.cards = [
      makeCard({ id: "c1", price: 5.0, quantity: 1 }),
      makeCard({ id: "c2", price: 3.5, quantity: 2 }),
    ];
    useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
    const { result } = renderHook(() => useDeckPrice());

    // 5.0 * 1 + 3.5 * 2 = 12.0
    expect(result.current.totalPrice).toBe(12.0);
    expect(result.current.hasCards).toBe(true);
  });

  it("includes commander price in the total", () => {
    const deck = makeEmptyDeck();
    deck.commander = makeCard({ id: "cmd", price: 20.0, quantity: 1 });
    deck.cards = [makeCard({ id: "c1", price: 1.0, quantity: 1 })];
    useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalPrice).toBe(21.0);
  });

  it("includes partner price in the total", () => {
    const deck = makeEmptyDeck();
    deck.commander = makeCard({ id: "cmd", price: 10.0, quantity: 1 });
    deck.partner = makeCard({ id: "prt", price: 8.0, quantity: 1 });
    deck.cards = [];
    useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalPrice).toBe(18.0);
  });

  it("treats null price as zero in the sum", () => {
    const deck = makeEmptyDeck();
    deck.cards = [
      makeCard({ id: "c1", price: null, quantity: 1 }),
      makeCard({ id: "c2", price: 4.0, quantity: 1 }),
    ];
    useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalPrice).toBe(4.0);
    expect(result.current.missingPriceCount).toBe(1);
  });

  it("counts all cards with missing price", () => {
    const deck = makeEmptyDeck();
    deck.cards = [
      makeCard({ id: "c1", price: null }),
      makeCard({ id: "c2", price: null }),
      makeCard({ id: "c3", price: 2.0 }),
    ];
    useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.missingPriceCount).toBe(2);
  });

  it("rounds the total to 2 decimal places", () => {
    const deck = makeEmptyDeck();
    deck.cards = [
      makeCard({ id: "c1", price: 1.005, quantity: 3 }),
    ];
    useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
    const { result } = renderHook(() => useDeckPrice());

    // 1.005 * 3 = 3.015 → rounded to 3.02 (Math.round(301.5)/100)
    expect(result.current.totalPrice).toBeLessThanOrEqual(3.02);
    expect(result.current.totalPrice).toBeGreaterThanOrEqual(3.01);
  });
});
