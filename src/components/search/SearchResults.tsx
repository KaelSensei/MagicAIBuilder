"use client";
/**
 * The search panel's result list, as a grid or a list, with its count and its empty states.
 *
 * Card catalog context, search panel. The builder page feeds it from `useCardSearchResults`;
 * with "Collection only" on, `CollectionOnlyCoverageNote` says how much of the search was checked.
 * Every state keeps the same status region mounted, so a screen reader announces the search as it
 * moves from "Searching…" to its count, its empty message or the reason nothing was searched; the
 * error is an alert of its own (`search-results-view.ts` says why).
 *
 * @module components/search/SearchResults
 */
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, LayoutGrid, List, Package } from "lucide-react";
import { CardGrid } from "@/components/card/CardGrid";
import { CardSearchListItem } from "@/components/card/CardSearchListItem";
import { useDeckStore } from "@/lib/deck/store";
import { countCopiesByZone } from "@/lib/deck/zone-source";
import type { DeckZone } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { CollectionOnlyState } from "@/hooks/useCardSearchResults";
import { CollectionOnlyCoverageNote } from "./CollectionOnlyNotice";
import { EmptySearchResult } from "./EmptySearchResult";
import {
  searchResultsView,
  type SearchResultsPhase,
} from "./search-results-view";
import { searchFailureMessageKey } from "./search-failure";

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
  /** The Scryfall query that produced an empty list, shown so the player can edit it. */
  readonly executedQuery?: string;
  /**
   * Clears the search filters. Given only while they narrow the search shown: an empty result
   * then offers "Clear filters" instead of the syntax hint.
   */
  readonly onClearFilters?: () => void;
}

/** The box around the status line: centred for a message, a header row above a list. */
const FRAME_CLASS: Readonly<Record<SearchResultsPhase, string>> = {
  searching:
    "flex items-center justify-center h-40 text-[var(--text-secondary)]",
  failed: "flex flex-col items-center justify-center h-40 text-red-400 gap-2",
  blocked:
    "flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--text-secondary)]",
  empty:
    "flex flex-col items-center justify-center min-h-40 py-4 text-[var(--text-secondary)] text-sm",
  listed: "flex items-center justify-between px-3 py-1.5",
};

/** How the status line reads in each layout; an empty one is kept for screen readers only. */
const STATUS_CLASS: Readonly<Record<SearchResultsPhase, string | undefined>> = {
  searching: undefined,
  failed: undefined,
  blocked: "block",
  empty: "block",
  listed: "text-xs text-[var(--text-secondary)]",
};

function PhaseIcon({ phase }: { readonly phase: SearchResultsPhase }) {
  switch (phase) {
    case "searching":
      return <Loader2 className="w-5 h-5 animate-spin mr-2" />;
    case "failed":
      return <AlertCircle className="w-5 h-5" />;
    case "blocked":
      return <Package className="h-5 w-5" aria-hidden="true" />;
    case "empty":
    case "listed":
      return null;
    default: {
      const unhandled: never = phase;
      return unhandled;
    }
  }
}

/**
 * Shows, in this order of precedence: a spinner while loading, why the search failed in the
 * player's words (`search-failure.ts`; never the thrown message), a "Collection only"
 * notice when there was no collection to filter by, an empty state, or the cards with their count.
 * The status line between them is one `<output>` that every state keeps mounted.
 */
export function SearchResults(props: SearchResultsProps) {
  const { cards, error, collectionOnly, executedQuery, onClearFilters } = props;
  const t = useTranslations("search");
  const { phase, status } = searchResultsView({
    isLoading: props.isLoading,
    error,
    cardCount: cards.length,
    totalCards: props.totalCards,
    collectionOnly,
  });
  const statusText = status ? t(status.key, status.values) : "";
  const coverageNote = collectionOnly?.kind === "scanned" && (
    <CollectionOnlyCoverageNote
      scannedCards={collectionOnly.scannedCards}
      totalMatches={collectionOnly.totalMatches}
      complete={collectionOnly.complete}
    />
  );

  return (
    <div className="flex flex-col">
      <div className={FRAME_CLASS[phase]}>
        <PhaseIcon phase={phase} />
        <output
          aria-live="polite"
          aria-atomic="true"
          className={statusText ? STATUS_CLASS[phase] : "sr-only"}
        >
          {statusText}
        </output>
        {phase === "failed" && error ? (
          <p role="alert" className="text-sm">
            {t(searchFailureMessageKey(error))}
          </p>
        ) : null}
        {phase === "empty" ? (
          <EmptySearchResult
            executedQuery={executedQuery}
            onClearFilters={onClearFilters}
          >
            {coverageNote}
          </EmptySearchResult>
        ) : null}
        {phase === "listed" ? <ViewModeToggle /> : null}
      </div>
      {phase === "listed" ? (
        <>
          {coverageNote}
          <ResultCards {...props} />
        </>
      ) : null}
    </div>
  );
}

/** Switches the list between card images and compact rows. */
function ViewModeToggle() {
  const t = useTranslations("search");
  const viewMode = useDeckStore((s) => s.searchViewMode);
  const setViewMode = useDeckStore((s) => s.setSearchViewMode);
  return (
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
  );
}

/** The cards, as a grid or as rows, each marked with its copies in the active deck. */
function ResultCards({
  cards,
  onCardClick,
  onAddToMaybeboard,
  onAddToZone,
  draggable = false,
}: SearchResultsProps) {
  const viewMode = useDeckStore((s) => s.searchViewMode);
  const activeDeck = useDeckStore((s) =>
    s.activeDeckId ? s.decks[s.activeDeckId] : null
  );
  const maybeboardNames = new Set(
    activeDeck?.maybeboard.map((c) => c.name) ?? []
  );
  const zoneCounts = useMemo(() => countCopiesByZone(activeDeck), [activeDeck]);

  if (viewMode === "grid") {
    return (
      <CardGrid
        cards={cards}
        onCardClick={onCardClick}
        onAddToMaybeboard={onAddToMaybeboard}
        onAddToZone={onAddToZone}
        zoneCounts={zoneCounts}
        maybeboardNames={maybeboardNames}
        draggable={draggable}
      />
    );
  }
  return (
    <div className="px-1 py-1">
      {cards.map((card) => (
        <CardSearchListItem
          key={card.id}
          card={card}
          onClick={onCardClick}
          onAddToMaybeboard={onAddToMaybeboard}
          onAddToZone={onAddToZone}
          zoneCounts={zoneCounts}
          isInMaybeboard={maybeboardNames.has(card.name)}
          draggable={draggable}
        />
      ))}
    </div>
  );
}
