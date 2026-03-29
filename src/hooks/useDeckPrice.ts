"use client";
// Hook that computes the total price of the active deck from the store
import { useMemo } from "react";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";

/**
 * Result returned by `useDeckPrice`.
 */
export interface DeckPriceResult {
  /** Sum of (card.price * card.quantity) for all cards with a known price, in USD. */
  totalPrice: number;
  /** Number of cards whose price is unknown (null). */
  missingPriceCount: number;
  /** Whether the active deck has any cards at all. */
  hasCards: boolean;
}

function sumCardPrices(cards: readonly DeckCard[]): number {
  return cards.reduce((sum, card) => {
    const unitPrice = card.price ?? 0;
    return sum + unitPrice * card.quantity;
  }, 0);
}

function countMissingPrices(cards: readonly DeckCard[]): number {
  return cards.filter((card) => card.price === null).length;
}

/**
 * Computes the total USD price of the active deck (main + commander zones).
 * Returns zeros/false when no deck is active.
 */
export function useDeckPrice(): DeckPriceResult {
  const store = useDeckStore();
  const activeDeck = store.getActiveDeck();

  const result = useMemo((): DeckPriceResult => {
    if (!activeDeck) {
      return { totalPrice: 0, missingPriceCount: 0, hasCards: false };
    }

    const allCards: DeckCard[] = [...activeDeck.cards];
    if (activeDeck.commander) allCards.push(activeDeck.commander);
    if (activeDeck.partner) allCards.push(activeDeck.partner);

    const rawTotal = sumCardPrices(allCards);

    return {
      totalPrice: Math.round(rawTotal * 100) / 100,
      missingPriceCount: countMissingPrices(allCards),
      hasCards: allCards.length > 0,
    };
  }, [activeDeck]);

  return result;
}
