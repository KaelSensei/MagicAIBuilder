"use client";
// Hook that computes the price of the active deck from the store
import { useMemo } from "react";
import { playedDeckCards } from "@/lib/deck/played-deck-cards";
import { totalWithoutBasicLands } from "@/lib/deck/price-breakdown";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";

/**
 * Result returned by `useDeckPrice`.
 */
export interface DeckPriceResult {
  /** Sum of (card.price * card.quantity) over the played cards with a known price, in USD. */
  totalPrice: number;
  /** Number of played card rows whose price is unknown (null). */
  missingPriceCount: number;
  /** Whether the active deck plays any card: a commander, a partner or a main-deck row. */
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
 * Computes the USD price of the active deck: the deck you buy to play, that is
 * the command zone (commander and partner) and the main deck, as the shopping
 * list counts it (`playedDeckCards`). Sideboard and Considering rows are left
 * out of every figure; the deck-list group headings still price them.
 *
 * Returns zeros, `hasCards: false` and no total without basics when no deck is
 * active or the deck plays no card yet, so a deck whose cards all sit in
 * Considering shows no price panel, like an empty deck.
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

    const playedCards = playedDeckCards(activeDeck);
    const rawTotal = sumCardPrices(playedCards);

    return {
      totalPrice: Math.round(rawTotal * 100) / 100,
      missingPriceCount: countMissingPrices(playedCards),
      hasCards: playedCards.length > 0,
      totalWithoutBasics: totalWithoutBasicLands(playedCards),
    };
  }, [activeDeck]);

  return result;
}
