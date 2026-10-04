"use client";

import {
  DeckComparisonPanel,
  type DeckOption,
} from "@/components/deck/DeckComparisonPanel";
import type { ComparableDeckProfileCard } from "@/lib/deck/comparison";

interface PublicDeckComparisonProps {
  readonly decks: readonly DeckOption[];
}

async function loadPublicDeck(id: string): Promise<{
  readonly cards: readonly ComparableDeckProfileCard[];
}> {
  const response = await fetch(`/api/deck/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error("Public deck unavailable");
  const deck: { readonly cards: readonly ComparableDeckProfileCard[] } =
    await response.json();
  return deck;
}

/** Compare two decks already exposed by the public commander discovery API. */
export function PublicDeckComparison({ decks }: PublicDeckComparisonProps) {
  if (decks.length < 2) return null;
  return <DeckComparisonPanel decks={decks} loadDeck={loadPublicDeck} />;
}
