"use client";
// Hook that computes the total price of the active deck from the store
import { useMemo } from "react";
import { totalWithoutBasicLands } from "@/lib/deck/price-breakdown";
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
  /**
   * The same total without the basic lands (CR 205.4c), in USD: what a player
   * who owns a box of basics would pay. Null when the deck holds no basic land.
   */
  totalWithoutBasics: number | null;
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
      return {
        totalPrice: 0,
        missingPriceCount: 0,
        hasCards: false,
        totalWithoutBasics: null,
      };
    }

    const allCards: DeckCard[] = [...activeDeck.cards];
    if (activeDeck.commander) allCards.push(activeDeck.commander);
    if (activeDeck.partner) allCards.push(activeDeck.partner);

    const rawTotal = sumCardPrices(allCards);

    return {
      totalPrice: Math.round(rawTotal * 100) / 100,
      missingPriceCount: countMissingPrices(allCards),
      hasCards: allCards.length > 0,
      totalWithoutBasics: totalWithoutBasicLands(allCards),
    };
  }, [activeDeck]);

  return result;
}
