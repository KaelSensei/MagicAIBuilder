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
  /**
   * Sum of (card.price * card.quantity) over the played cards with a known
   * price, in USD. Null when the deck plays cards but none of them has a known
   * price (I-01): an unknown price is never shown as $0.00. A deck that plays
   * no card is worth 0.
   */
  readonly totalPrice: number | null;
  /** Number of played card rows whose price is unknown (null). */
  readonly missingPriceCount: number;
  /** Whether the active deck plays any card: a commander, a partner or a main-deck row. */
  readonly hasCards: boolean;
  /**
   * The same total without the basic lands (CR 205.4c), in USD: what a player
   * who owns a box of basics would pay. Null when the deck holds no basic land
   * or when the total itself is unknown.
   */
  readonly totalWithoutBasics: number | null;
}

const NO_PLAYED_CARD: DeckPriceResult = {
  totalPrice: 0,
  missingPriceCount: 0,
  hasCards: false,
  totalWithoutBasics: null,
};

function sumKnownPrices(cards: readonly DeckCard[]): number {
  return cards.reduce(
    (sum, card) =>
      card.price === null ? sum : sum + card.price * card.quantity,
    0
  );
}

function countMissingPrices(cards: readonly DeckCard[]): number {
  return cards.filter((card) => card.price === null).length;
}

/** The price figures of a deck that plays at least one card. */
function priceOfPlayedCards(playedCards: readonly DeckCard[]): DeckPriceResult {
  const missingPriceCount = countMissingPrices(playedCards);
  if (missingPriceCount === playedCards.length) {
    return {
      totalPrice: null,
      missingPriceCount,
      hasCards: true,
      totalWithoutBasics: null,
    };
  }
  return {
    totalPrice: Math.round(sumKnownPrices(playedCards) * 100) / 100,
    missingPriceCount,
    hasCards: true,
    totalWithoutBasics: totalWithoutBasicLands(playedCards),
  };
}

/**
 * Computes the USD price of the active deck: the deck you buy to play, that is
 * the command zone (commander and partner) and the main deck, as the shopping
 * list counts it (`playedDeckCards`). Sideboard and Considering rows are left
 * out of every figure; the deck-list group headings still price them.
 *
 * Returns zeros, `hasCards: false` and no total without basics when no deck is
 * active or the deck plays no card yet, so a deck whose cards all sit in
 * Considering shows no price panel, like an empty deck. Returns a null total
 * when the deck plays cards and none of them has a known price.
 */
export function useDeckPrice(): DeckPriceResult {
  const store = useDeckStore();
  const activeDeck = store.getActiveDeck();

  return useMemo((): DeckPriceResult => {
    if (!activeDeck) return NO_PLAYED_CARD;
    const playedCards = playedDeckCards(activeDeck);
    if (playedCards.length === 0) return NO_PLAYED_CARD;
    return priceOfPlayedCards(playedCards);
  }, [activeDeck]);
}
