"use client";
/**
 * The search panel's result list, as a grid or a list, with its count and its empty states.
 *
 * Card catalog context, search panel. The builder page feeds it from `useCardSearchResults`;
 * with "Collection only" on, the notices of `CollectionOnlyNotice` explain what the list holds.
 *
 * @module components/search/SearchResults
 */
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, LayoutGrid, List } from "lucide-react";
import { CardGrid } from "@/components/card/CardGrid";
import { CardSearchListItem } from "@/components/card/CardSearchListItem";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckZone } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { CollectionOnlyState } from "@/hooks/useCardSearchResults";
import {
  CollectionOnlyBlockedState,
  CollectionOnlyCoverageNote,
} from "./CollectionOnlyNotice";

interface SearchResultsProps {
  readonly cards: readonly ScryfallCard[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly totalCards?: number;
  readonly onCardClick?: (card: ScryfallCard) => void;
  readonly draggable?: boolean;
  readonly onAddToMaybeboard?: (card: ScryfallCard) => void;
  readonly onAddToZone?: (card: ScryfallCard, zone: DeckZone) => void;
  /** Set while "Collection only" filters `cards`; changes the count and the empty states. */
  readonly collectionOnly?: CollectionOnlyState;
}

/**
 * Shows, in this order of precedence: a spinner while loading, the error, a "Collection only"
 * notice when there was no collection to filter by, an empty state, or the cards with their count.
 */
export function SearchResults({
  cards,
  isLoading,
  error,
  totalCards,
  onCardClick,
  onAddToMaybeboard,
  onAddToZone,
  draggable = false,
  collectionOnly,
}: SearchResultsProps) {
  const t = useTranslations("search");
  const viewMode = useDeckStore((s) => s.searchViewMode);
  const setViewMode = useDeckStore((s) => s.setSearchViewMode);
  const activeDeck = useDeckStore((s) =>
    s.activeDeckId ? s.decks[s.activeDeckId] : null
  );
  const maybeboardNames = new Set(
    activeDeck?.maybeboard.map((c) => c.name) ?? []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--text-secondary)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        {t("searching")}
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

  if (collectionOnly && collectionOnly.kind !== "scanned") {
    return <CollectionOnlyBlockedState state={collectionOnly} />;
  }

  const coverageNote = collectionOnly && (
    <CollectionOnlyCoverageNote
      scannedCards={collectionOnly.scannedCards}
      totalMatches={collectionOnly.totalMatches}
      complete={collectionOnly.complete}
    />
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-[var(--text-secondary)] text-sm">
        <p>{t(collectionOnly ? "collectionOnly.noMatch" : "noResults")}</p>
        {coverageNote}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header: count + view toggle */}
      <div className="flex items-center justify-between px-3 py-1.5">
        {collectionOnly ? (
          <p className="text-xs text-[var(--text-secondary)]">
            {t("collectionOnly.ownedCount", { count: cards.length })}
          </p>
        ) : (
          totalCards != null && (
            <p className="text-xs text-[var(--text-secondary)]">
              {t("resultCount", { count: totalCards })}
            </p>
          )
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1 rounded transition-colors ${
              viewMode === "grid"
                ? "text-[var(--accent-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title={t("gridView")}
            aria-label={t("gridView")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1 rounded transition-colors ${
              viewMode === "list"
                ? "text-[var(--accent-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title={t("listView")}
            aria-label={t("listView")}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {coverageNote}

      {viewMode === "grid" ? (
        <CardGrid
          cards={cards}
          onCardClick={onCardClick}
          onAddToMaybeboard={onAddToMaybeboard}
          onAddToZone={onAddToZone}
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
              onAddToZone={onAddToZone}
              isInMaybeboard={maybeboardNames.has(card.name)}
              draggable={draggable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
