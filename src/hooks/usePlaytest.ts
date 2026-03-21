"use client";
// Hook for playtest mode — shuffle, draw, mulligan, next turn
import { useCallback, useState } from "react";
import type { Deck, DeckCard, PlaytestState } from "@/lib/deck/types";

/** Fisher-Yates shuffle — returns a new shuffled array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Expand a deck into a flat array of cards (including commander copies that might be in hand for play purposes) */
function deckToCards(deck: Deck): DeckCard[] {
  const cards: DeckCard[] = [];
  if (deck.commander) cards.push(deck.commander);
  if (deck.partner) cards.push(deck.partner);
  cards.push(...deck.cards);
  return cards;
}

export function usePlaytest() {
  const [state, setState] = useState<PlaytestState | null>(null);

  /** Start a new playtest — shuffle the full deck, draw 7 */
  const startPlaytest = useCallback((deck: Deck): PlaytestState => {
    const allCards = deckToCards(deck);
    const shuffled = shuffle(allCards);
    const hand = shuffled.slice(0, 7);
    const library = shuffled.slice(7);
    const newState: PlaytestState = { hand, library, turn: 1, mulliganCount: 0 };
    setState(newState);
    return newState;
  }, []);

  /**
   * London mulligan:
   * Put all cards back, shuffle, draw (7 - mulliganCount) cards.
   * For simplicity, we auto-keep all drawn cards (no selection UI needed).
   */
  const mulligan = useCallback((current: PlaytestState, deck: Deck): PlaytestState => {
    const newMulliganCount = current.mulliganCount + 1;
    const drawCount = Math.max(0, 7 - newMulliganCount);
    const allCards = deckToCards(deck);
    const shuffled = shuffle(allCards);
    const hand = shuffled.slice(0, drawCount);
    const library = shuffled.slice(drawCount);
    const newState: PlaytestState = {
      hand,
      library,
      turn: 1,
      mulliganCount: newMulliganCount,
    };
    setState(newState);
    return newState;
  }, []);

  /** Draw 1 card from the top of the library */
  const drawCard = useCallback((current: PlaytestState): PlaytestState => {
    if (current.library.length === 0) return current;
    const [drawn, ...rest] = current.library;
    const newState: PlaytestState = {
      ...current,
      hand: [...current.hand, drawn],
      library: rest,
    };
    setState(newState);
    return newState;
  }, []);

  /** End turn — increment turn counter and draw a card */
  const nextTurn = useCallback((current: PlaytestState): PlaytestState => {
    if (current.library.length === 0) {
      const newState = { ...current, turn: current.turn + 1 };
      setState(newState);
      return newState;
    }
    const [drawn, ...rest] = current.library;
    const newState: PlaytestState = {
      ...current,
      hand: [...current.hand, drawn],
      library: rest,
      turn: current.turn + 1,
    };
    setState(newState);
    return newState;
  }, []);

  /** Reset playtest state */
  const stopPlaytest = useCallback(() => {
    setState(null);
  }, []);

  return { state, startPlaytest, mulligan, drawCard, nextTurn, stopPlaytest };
}
