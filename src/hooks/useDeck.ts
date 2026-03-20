"use client";
// Zustand hook for deck state
import { useDeckStore } from "@/lib/deck/store";
import { computeDeckStats } from "@/lib/deck/stats";
import { useMemo } from "react";

/** Main deck hook — provides active deck and computed stats */
export function useDeck() {
  const store = useDeckStore();
  const activeDeck = store.getActiveDeck();

  const stats = useMemo(() => {
    if (!activeDeck) return null;
    return computeDeckStats(activeDeck);
  }, [activeDeck]);

  return {
    deck: activeDeck,
    stats,
    // Actions
    createDeck: store.createDeck,
    deleteDeck: store.deleteDeck,
    renameDeck: store.renameDeck,
    setActiveDeck: store.setActiveDeck,
    setCommander: store.setCommander,
    setPartner: store.setPartner,
    addCard: store.addCard,
    removeCard: store.removeCard,
    updateCardCategory: store.updateCardCategory,
    setTargetBracket: store.setTargetBracket,
    setBudget: store.setBudget,
    // Deck list
    decks: Object.values(store.decks),
  };
}
