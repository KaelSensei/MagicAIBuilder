import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDeckPrice } from "./useDeckPrice";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard, Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return aDeckCard({
    id: `card-${Math.random()}`,
    name: "Test Card",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Creature",
    category: "creature",
    ...overrides,
  });
}

function makeEmptyDeck(id = "deck-1"): Deck {
  return aDeck({ id });
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
    expect(result.current.totalWithoutBasics).toBeNull();
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

  it("gives the total without basic lands beside the unchanged total", () => {
    const deck = makeEmptyDeck();
    deck.commander = makeCard({ id: "cmd", price: 10.0 });
    const forests = makeCard({ typeLine: "Basic Land — Forest", price: 0.25 });
    deck.cards = [
      makeCard({ id: "c1", price: 2.0 }),
      { ...forests, quantity: 4 },
    ];
    useDeckStore.setState({
      decks: { [deck.id]: deck },
      activeDeckId: deck.id,
    });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalPrice).toBe(13.0);
    expect(result.current.totalWithoutBasics).toBe(12.0);
  });

  it("has no total without basic lands when the deck holds none", () => {
    const deck = makeEmptyDeck();
    deck.cards = [makeCard({ id: "c1", price: 2.0 })];
    useDeckStore.setState({
      decks: { [deck.id]: deck },
      activeDeckId: deck.id,
    });
    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalWithoutBasics).toBeNull();
  });
});

describe("useDeckPrice counts the deck you buy to play: the main deck and the command zone", () => {
  const solRing = aDeckCard({ id: "sol-ring", name: "Sol Ring", price: 2 });
  const sideboardCard = aDeckCard({
    id: "side",
    name: "Sideboard Card",
    price: 5,
    zone: "sideboard",
  });
  const consideredCard = aDeckCard({
    id: "maybe",
    name: "Considered Card",
    price: 7,
    zone: "maybeboard",
  });

  function openInStore(deck: Deck): void {
    useDeckStore.setState({
      decks: { [deck.id]: deck },
      activeDeckId: deck.id,
    });
  }

  it("leaves the Sideboard and Considering cards out of the deck total", () => {
    openInStore(
      aDeck({
        commander: aDeckCard({ id: "cmd", name: "Commander", price: 10 }),
        cards: [solRing, sideboardCard, consideredCard],
      })
    );

    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalPrice).toBe(12);
  });

  it("leaves a sideboard Island and a sideboard card out of the total without basic lands", () => {
    openInStore(
      aDeck({
        cards: [
          solRing,
          aDeckCard({
            id: "forest",
            name: "Forest",
            typeLine: "Basic Land — Forest",
            price: 0.25,
          }),
          aDeckCard({
            id: "island",
            name: "Island",
            typeLine: "Basic Land — Island",
            price: 0.5,
            zone: "sideboard",
          }),
          sideboardCard,
        ],
      })
    );

    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.totalWithoutBasics).toBe(2);
  });

  it("does not count a Considering card with no price among the cards without a price", () => {
    openInStore(
      aDeck({
        cards: [
          aDeckCard({ id: "unpriced", name: "Unpriced Card", price: null }),
          { ...consideredCard, price: null },
        ],
      })
    );

    const { result } = renderHook(() => useDeckPrice());

    expect(result.current.missingPriceCount).toBe(1);
  });

  it("shows no total for a deck whose only cards are in Considering, like a deck with no cards", () => {
    openInStore(
      aDeck({
        cards: [
          consideredCard,
          aDeckCard({
            id: "unpriced",
            name: "Unpriced Card",
            price: null,
            zone: "maybeboard",
          }),
        ],
      })
    );

    const { result } = renderHook(() => useDeckPrice());

    expect(result.current).toEqual({
      totalPrice: 0,
      missingPriceCount: 0,
      hasCards: false,
      totalWithoutBasics: null,
    });
  });
});
