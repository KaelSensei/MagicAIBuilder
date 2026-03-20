"use client";
// Search results panel
import { Loader2, AlertCircle } from "lucide-react";
import { CardGrid } from "@/components/card/CardGrid";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface SearchResultsProps {
  cards: ScryfallCard[];
  isLoading: boolean;
  error: Error | null;
  totalCards?: number;
  onCardClick?: (card: ScryfallCard) => void;
}

export function SearchResults({
  cards,
  isLoading,
  error,
  totalCards,
  onCardClick,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--text-secondary)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Searching...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-red-400 gap-2">
        <AlertCircle className="w-5 h-5" />
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--text-secondary)] text-sm">
        No cards found. Try a different search.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {totalCards != null && (
        <p className="text-xs text-[var(--text-secondary)] px-3 py-1.5">
          {totalCards.toLocaleString()} results
        </p>
      )}
      <CardGrid cards={cards} onCardClick={onCardClick} />
    </div>
  );
}
