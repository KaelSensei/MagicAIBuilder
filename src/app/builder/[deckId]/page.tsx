"use client";
// Main builder view — 3-panel layout: Search | DeckEditor | Stats
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDeckStore } from "@/lib/deck/store";
import { useDeck } from "@/hooks/useDeck";
import { useBracketScore } from "@/hooks/useBracketScore";
import { useCardSearch } from "@/hooks/useCardSearch";
import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { DeckEditor } from "@/components/deck/DeckEditor";
import { DeckStats } from "@/components/deck/DeckStats";
import { BracketIndicator } from "@/components/deck/BracketIndicator";
import { GameChangersBadge } from "@/components/deck/GameChangersBadge";
import { BanlistAlert } from "@/components/deck/BanlistAlert";
import { buildSearchQuery, buildCommanderSearchQuery } from "@/lib/scryfall/search";
import type { SearchFilters as Filters } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { ArrowLeft, Crown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { ToastContainer } from "@/components/ui/Toast";
import { CombosPanel } from "@/components/deck/CombosPanel";
import { useCombos } from "@/hooks/useCombos";

const DEFAULT_FILTERS: Filters = {
  colors: [],
  types: [],
  cmcMin: null,
  cmcMax: null,
  priceMax: null,
};

export default function BuilderPage() {
  const params = useParams();
  const deckId = params.deckId as string;

  // Ensure this deck is active
  const { setActiveDeck, addCard, removeCard, setCommander } = useDeck();
  const decks = useDeckStore((s) => s.decks);
  const deck = decks[deckId] ?? null;

  // Set active deck on mount
  useEffect(() => {
    if (deckId) setActiveDeck(deckId);
  }, [deckId, setActiveDeck]);

  const { stats } = useDeck();
  const bracketScore = useBracketScore(deck);
  const { data: combos, isLoading: combosLoading } = useCombos(deck);

  // Search state
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [commanderMode, setCommanderMode] = useState(false);

  // Track active drag card for overlay
  const [activeDragCard, setActiveDragCard] = useState<ScryfallCard | null>(null);

  const query = commanderMode
    ? buildCommanderSearchQuery(searchText, filters)
    : buildSearchQuery(searchText, filters);

  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useCardSearch(query);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleCardClick = useCallback(
    (card: ScryfallCard) => {
      if (commanderMode) {
        setCommander(card);
        setCommanderMode(false);
      } else {
        addCard(card);
      }
    },
    [addCard, setCommander, commanderMode]
  );

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: { active: { data: { current?: { card?: ScryfallCard } } } }) => {
    const card = event.active.data.current?.card;
    if (card) setActiveDragCard(card);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragCard(null);
      const { active, over } = event;
      if (!over) return;

      const card = active.data.current?.card as ScryfallCard | undefined;
      if (!card) return;

      // Dropped on a category zone — add to deck
      if (over.id.toString().startsWith("deck-category-")) {
        addCard(card);
      }
    },
    [addCard]
  );

  if (!deck) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">Deck not found</p>
            <Link href="/" className="text-[var(--accent)] hover:underline text-sm">
              ← Back to My Decks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <Header deckId={deckId} />

        {/* Deck title bar */}
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 flex items-center gap-3">
          <Link
            href="/"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">
            {deck.name}
          </h1>
          <span className="text-xs text-[var(--text-secondary)]">
            {(deck.cards.length + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0))} / 100
          </span>
        </div>

        {/* 3-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel 1: Search (300px) */}
          <motion.div
            className="w-[300px] shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--surface)]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-3 border-b border-[var(--border)] space-y-2">
              <SearchBar
                onSearch={handleSearch}
                isLoading={searchLoading}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters((f) => !f)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showFilters ? "Hide filters" : "Show filters"}
                </button>
                {/* Commander mode toggle */}
                <button
                  onClick={() => setCommanderMode((m) => !m)}
                  className={cn(
                    "ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors",
                    commanderMode
                      ? "border-amber-500 text-amber-400 bg-amber-500/10"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  )}
                  title="Filter for legendary creatures (commanders)"
                >
                  <Crown className="w-3 h-3" />
                  Commander
                </button>
              </div>
              {showFilters && (
                <SearchFilters filters={filters} onChange={setFilters} />
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <SearchResults
                cards={searchData?.data ?? []}
                isLoading={searchLoading}
                error={searchError as Error | null}
                totalCards={searchData?.total_cards}
                onCardClick={handleCardClick}
                draggable={true}
              />
            </div>
          </motion.div>

          {/* Panel 2: Deck Editor (flex-1) */}
          <motion.div
            className="flex-1 border-r border-[var(--border)] flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Banlist alert */}
            {stats && (stats.bannedCards.length > 0 || stats.colorIdentityViolations.length > 0) && (
              <div className="p-3 border-b border-[var(--border)]">
                <BanlistAlert
                  bannedCards={stats.bannedCards}
                  colorViolations={stats.colorIdentityViolations}
                />
              </div>
            )}

            <DeckEditor
              deck={deck}
              onRemoveCard={removeCard}
              className="flex-1 overflow-hidden"
            />
          </motion.div>

          {/* Panel 3: Stats (280px) */}
          <motion.div
            className="w-[280px] shrink-0 flex flex-col bg-[var(--surface)] overflow-y-auto p-3 gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <BracketIndicator
              score={bracketScore}
              targetBracket={deck.targetBracket}
            />

            <GameChangersBadge
              count={stats?.gameChangersCount ?? 0}
              names={stats?.gameChangersList ?? []}
              targetBracket={deck.targetBracket}
            />

            <CombosPanel
              combos={combos}
              isLoading={combosLoading}
              isEnabled={(deck?.cards.length ?? 0) >= 10}
            />

            <DeckStats stats={stats} targetBracket={deck.targetBracket} />
          </motion.div>
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer />

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragCard && (
          <div className="bg-[var(--surface)] border border-[var(--accent)] rounded px-3 py-2 text-sm text-[var(--text-primary)] shadow-xl">
            {activeDragCard.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
