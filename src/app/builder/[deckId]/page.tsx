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
import { buildSearchQuery, buildCommanderSearchQuery, buildSetSearchQuery, buildColorSearchQuery } from "@/lib/scryfall/search";
import { SetAutocomplete } from "@/components/search/SetAutocomplete";
import type { SearchFilters as Filters } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { ArrowLeft, Crown, Download } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { ToastContainer } from "@/components/ui/Toast";
import { CombosPanel } from "@/components/deck/CombosPanel";
import { useCombos } from "@/hooks/useCombos";
import { ExportModal } from "@/components/deck/ExportModal";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";

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
  const { setActiveDeck, addCard, removeCard, setCommander, updateCardCategory } = useDeck();
  const decks = useDeckStore((s) => s.decks);
  const loadDecks = useDeckStore((s) => s.loadDecks);
  const isSyncing = useDeckStore((s) => s.isSyncing);
  const deck = decks[deckId] ?? null;

  // Set active deck on mount
  useEffect(() => {
    if (deckId) setActiveDeck(deckId);
  }, [deckId, setActiveDeck]);

  // If deck not in store (e.g. direct navigation / page refresh), load from DB
  useEffect(() => {
    if (deckId && !deck && !isSyncing) {
      loadDecks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const { stats } = useDeck();
  const bracketScore = useBracketScore(deck);
  const { data: combos, isLoading: combosLoading } = useCombos(deck);

  // Search state
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [commanderMode, setCommanderMode] = useState(false);

  // Search mode
  type SearchMode = "name" | "set" | "color";
  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [selectedSet, setSelectedSet] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<string[]>([]);

  // Track active drag card for overlay
  const [activeDragCard, setActiveDragCard] = useState<ScryfallCard | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [printingCard, setPrintingCard] = useState<ScryfallCard | null>(null);

  const query = (() => {
    if (commanderMode) return buildCommanderSearchQuery(searchText, filters);
    switch (searchMode) {
      case "set":
        return selectedSet ? buildSetSearchQuery(selectedSet, colorFilter) : "";
      case "color":
        return colorFilter.length > 0 || searchText
          ? buildColorSearchQuery(colorFilter, searchText)
          : "";
      default:
        return buildSearchQuery(searchText, filters);
    }
  })();

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
        // Open printing selector so user can pick their preferred art
        setPrintingCard(card);
      }
    },
    [setCommander, commanderMode]
  );

  const handlePrintingSelect = useCallback(
    (card: ScryfallCard) => {
      addCard(card);
      setPrintingCard(null);
    },
    [addCard]
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

      const overId = over.id.toString();

      // Case 1: drag from search results → drop on deck category zone
      const searchCard = active.data.current?.card as ScryfallCard | undefined;
      if (searchCard && overId.startsWith("deck-category-")) {
        addCard(searchCard);
        return;
      }

      // Case 2: intra-deck drag — move card between categories
      const cardId = active.data.current?.cardId as string | undefined;
      if (cardId) {
        if (overId.startsWith("deck-category-")) {
          const newCategory = overId.replace("deck-category-", "");
          const sourceCategory = active.data.current?.sourceCategory as string | undefined;
          if (newCategory !== sourceCategory) {
            updateCardCategory(cardId, newCategory as import("@/lib/deck/types").CardCategory);
          }
        } else if (overId.startsWith("deck-card-")) {
          // Dropped over another card → move to that card's category
          const targetCardId = overId.replace("deck-card-", "");
          const targetCard = deck?.cards.find((c) => c.id === targetCardId);
          const sourceCategory = active.data.current?.sourceCategory as string | undefined;
          if (targetCard && targetCard.category !== sourceCategory) {
            updateCardCategory(cardId, targetCard.category);
          }
        }
      }
    },
    [addCard, updateCardCategory, deck]
  );

  if (!deck) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {isSyncing ? (
              <p className="text-[var(--text-secondary)]">Loading deck…</p>
            ) : (
              <>
                <p className="text-[var(--text-secondary)] mb-4">Deck not found</p>
                <Link href="/" className="text-[var(--accent)] hover:underline text-sm">
                  ← Back to My Decks
                </Link>
              </>
            )}
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
          <button
            onClick={() => setShowExport(true)}
            className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
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
              {/* Search mode tabs */}
              <div className="flex gap-1 p-0.5 bg-[var(--background)] rounded-lg">
                {(["name", "set", "color"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSearchMode(mode);
                      setSearchText("");
                      setSelectedSet("");
                      setColorFilter([]);
                    }}
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-md font-medium transition-all capitalize",
                      searchMode === mode
                        ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {mode === "name" ? "Name" : mode === "set" ? "By Set" : "By Color"}
                  </button>
                ))}
              </div>

              {/* Mode-specific controls */}
              {searchMode === "name" && (
                <>
                  <SearchBar onSearch={handleSearch} isLoading={searchLoading} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters((f) => !f)}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showFilters ? "Hide filters" : "Show filters"}
                    </button>
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
                  {showFilters && <SearchFilters filters={filters} onChange={setFilters} />}
                </>
              )}

              {searchMode === "set" && (
                <SetAutocomplete
                  value={selectedSet}
                  onChange={(code) => setSelectedSet(code)}
                  onClear={() => setSelectedSet("")}
                />
              )}

              {searchMode === "color" && (
                <div className="space-y-2">
                  <SearchBar
                    onSearch={handleSearch}
                    isLoading={searchLoading}
                    placeholder="Filter by name (optional)…"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { code: "W", label: "White", symbol: "☀️" },
                      { code: "U", label: "Blue", symbol: "💧" },
                      { code: "B", label: "Black", symbol: "💀" },
                      { code: "R", label: "Red", symbol: "🔥" },
                      { code: "G", label: "Green", symbol: "🌲" },
                    ].map((c) => (
                      <button
                        key={c.code}
                        onClick={() =>
                          setColorFilter((prev) =>
                            prev.includes(c.code)
                              ? prev.filter((x) => x !== c.code)
                              : [...prev, c.code]
                          )
                        }
                        className={cn(
                          "w-9 h-9 rounded-full text-base transition-all border-2",
                          colorFilter.includes(c.code)
                            ? "border-[var(--accent)] scale-110"
                            : "border-transparent opacity-50 hover:opacity-100"
                        )}
                        title={c.label}
                      >
                        {c.symbol}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setColorFilter((prev) =>
                          prev.includes("C")
                            ? prev.filter((x) => x !== "C")
                            : [...prev, "C"]
                        )
                      }
                      className={cn(
                        "px-2 h-9 rounded-full text-xs font-medium transition-all border-2",
                        colorFilter.includes("C")
                          ? "border-[var(--accent)] text-[var(--accent)] scale-110"
                          : "border-[var(--border)] text-[var(--text-secondary)] opacity-70 hover:opacity-100"
                      )}
                      title="Colorless"
                    >
                      ◇
                    </button>
                  </div>
                  {colorFilter.length === 0 && !searchText && (
                    <p className="text-xs text-[var(--text-secondary)] italic">
                      Select colors to browse cards
                    </p>
                  )}
                </div>
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

      {/* Export modal */}
      {showExport && deck && (
        <ExportModal deck={deck} onClose={() => setShowExport(false)} />
      )}

      {/* Printing selector modal */}
      {printingCard && (
        <PrintingSelectorModal
          card={printingCard}
          onSelect={handlePrintingSelect}
          onClose={() => setPrintingCard(null)}
        />
      )}

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
