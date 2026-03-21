"use client";
// Search results panel with grid/list toggle
import { Loader2, AlertCircle, LayoutGrid, List } from "lucide-react";
import { CardGrid } from "@/components/card/CardGrid";
import { CardSearchListItem } from "@/components/card/CardSearchListItem";
import { useDeckStore } from "@/lib/deck/store";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface SearchResultsProps {
  readonly cards: readonly ScryfallCard[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly totalCards?: number;
  readonly onCardClick?: (card: ScryfallCard) => void;
  readonly draggable?: boolean;
}

export function SearchResults({
  cards,
  isLoading,
  error,
  totalCards,
  onCardClick,
  onAddToMaybeboard,
  draggable = false,
}: SearchResultsProps) {
  const viewMode = useDeckStore((s) => s.searchViewMode);
  const setViewMode = useDeckStore((s) => s.setSearchViewMode);
  const activeDeck = useDeckStore((s) => s.activeDeckId ? s.decks[s.activeDeckId] : null);
  const maybeboardNames = new Set(activeDeck?.maybeboard.map((c) => c.name) ?? []);

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
      {/* Header: count + view toggle */}
      <div className="flex items-center justify-between px-3 py-1.5">
        {totalCards != null && (
          <p className="text-xs text-[var(--text-secondary)]">
            {totalCards.toLocaleString()} results
          </p>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 rounded transition-colors ${
              viewMode === "grid"
                ? "text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded transition-colors ${
              viewMode === "list"
                ? "text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <CardGrid
          cards={cards}
          onCardClick={onCardClick}
          onAddToMaybeboard={onAddToMaybeboard}
          maybeboardNames={maybeboardNames}
          draggable={draggable}
        />
      ) : (
        <div className="px-1 py-1">
          {cards.map((card) => (
            <CardSearchListItem
              key={card.id}
              card={card}
              onClick={onCardClick}
              onAddToMaybeboard={onAddToMaybeboard}
              isInMaybeboard={maybeboardNames.has(card.name)}
              draggable={draggable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
