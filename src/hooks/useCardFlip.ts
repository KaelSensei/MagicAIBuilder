"use client";
import { useState, useCallback } from "react";
import type { CardFace } from "@/lib/deck/types";

export interface UseCardFlipResult {
  isFlipped: boolean;
  canFlip: boolean;
  currentFace: CardFace | null;
  toggle: () => void;
}

/**
 * Manages flip state for a double-faced card.
 * `canFlip` is false (and `currentFace` null) when `cardFaces` is undefined.
 */
export function useCardFlip(cardFaces: [CardFace, CardFace] | undefined): UseCardFlipResult {
  const [isFlipped, setIsFlipped] = useState(false);
  const canFlip = cardFaces !== undefined;
  let currentFace: CardFace | null = null;
  if (canFlip) {
    currentFace = isFlipped ? cardFaces[1] : cardFaces[0];
  }
  const toggle = useCallback(() => setIsFlipped((f) => !f), []);
  return { isFlipped, canFlip, currentFace, toggle };
}
