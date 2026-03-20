"use client";
// Computed bracket score from deck state
import { useMemo } from "react";
import { scoreBracket } from "@/lib/deck/bracket";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck, BracketScore } from "@/lib/deck/types";

/** Returns live bracket score for the active deck */
export function useBracketScore(deck: Deck | null): BracketScore | null {
  return useMemo(() => {
    if (!deck) return null;
    const stats = computeDeckStats(deck);
    return scoreBracket(deck, stats);
  }, [deck]);
}
