"use client";
// Main builder view — 3-panel layout: Search | DeckEditor | Stats
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDeckStore } from "@/lib/deck/store";
import { useUIStore } from "@/lib/ui/store";
import { useDeck } from "@/hooks/useDeck";
import { useBracketScore } from "@/hooks/useBracketScore";
import { useCardSearch } from "@/hooks/useCardSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { DeckEditor } from "@/components/deck/DeckEditor";
import { DeckStats } from "@/components/deck/DeckStats";
import { BracketIndicator } from "@/components/deck/BracketIndicator";
import { GameChangersBadge } from "@/components/deck/GameChangersBadge";
import { BanlistAlert } from "@/components/deck/BanlistAlert";
import { buildSearchQuery, buildCommanderSearchQuery, buildSetSearchQuery, buildColorSearchQuery, buildPartnerSearchQuery } from "@/lib/scryfall/search";
import { supportsPartner, partnerSlotLabel } from "@/lib/deck/pairing";
import { SetAutocomplete } from "@/components/search/SetAutocomplete";
import type { SearchFilters as Filters, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { ArrowLeft, Check, Copy, Crown, Download, FileText, Pencil } from "lucide-react";
import { KeyboardShortcutsModal } from "@/components/layout/KeyboardShortcutsModal";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { ToastContainer } from "@/components/ui/Toast";
import { CombosPanel } from "@/components/deck/CombosPanel";
import { useCombos } from "@/hooks/useCombos";
import { ExportModal } from "@/components/deck/ExportModal";
import { ImportDialog } from "@/components/deck/ImportDialog";
import { BulkEditModal } from "@/components/deck/BulkEditModal";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { AISuggestionsPanel } from "@/components/deck/AISuggestionsPanel";
import { useResizePanel } from "@/hooks/useResizePanel";

type SearchMode = "name" | "set" | "color";
function getSearchModeLabel(mode: SearchMode): string {
  if (mode === "name") return "Name";
  if (mode === "set") return "By Set";
  return "By Color";
}

const DEFAULT_FILTERS: Filters = {
  colors: [],
  types: [],
  cmcMin: null,
  cmcMax: null,
  priceMax: null,
};

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  // Ensure this deck is active
  const { setActiveDeck, addCard, removeCard, setCommander, setPartner, updateCardCategory } = useDeck();
  const renameDeck = useDeckStore((s) => s.renameDeck);
  const duplicateDeck = useDeckStore((s) => s.duplicateDeck);
  const setManualBracket = useDeckStore((s) => s.setManualBracket);
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
  const { result: aiResult, isLoading: aiLoading, error: aiError, analyze: analyzeAI } = useAISuggestions();

  // Search state
  const [searchText, setSearchText] = useState("");
  const { width: searchPanelWidth, handleMouseDown: handleSearchResize, handleKeyDown: handleSearchResizeKeyDown } = useResizePanel({
    initialWidth: 300,
    minWidth: 220,
    maxWidth: 520,
    storageKey: "builder-search-panel-width",
  });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [commanderMode, setCommanderMode] = useState(false);
  const [partnerMode, setPartnerMode] = useState(false);

  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [selectedSet, setSelectedSet] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const toggleColorFilter = useCallback((code: string) => {
    setColorFilter((prev) => prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]);
  }, []);

  // Inline deck name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Track active drag card for overlay
  const [activeDragCard, setActiveDragCard] = useState<ScryfallCard | null>(null);
  const [printingCard, setPrintingCard] = useState<ScryfallCard | null>(null);

  // State for changing the printing/edition of an existing deck card
  const [deckCardForPrinting, setDeckCardForPrinting] = useState<DeckCard | null>(null);
  const [deckCardPrintingCard, setDeckCardPrintingCard] = useState<ScryfallCard | null>(null);

  // UI store — modals + keyboard signals
  const showExport = useUIStore((s) => s.showExportModal);
  const setShowExport = useUIStore((s) => s.setShowExportModal);
  const showImportModal = useUIStore((s) => s.showImportModal);
  const setShowImportModal = useUIStore((s) => s.setShowImportModal);

  // Input focus tracking — suppresses single-key shortcuts when typing
  const [isInputFocused, setIsInputFocused] = useState(false);

  const query = (() => {
    if (commanderMode) return buildCommanderSearchQuery(searchText, filters);
    if (partnerMode && deck) return buildPartnerSearchQuery(deck.pairingType, searchText, filters);
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
        // Stay in commander mode — user may want to change commander again
      } else if (partnerMode) {
        setPartner(card);
        // Stay in partner mode — user may want to change partner again
      } else {
        // Open printing selector so user can pick their preferred art
        setPrintingCard(card);
      }
    },
    [setCommander, setPartner, commanderMode, partnerMode]
  );

  const handlePrintingSelect = useCallback(
    (card: ScryfallCard) => {
      addCard(card);
      setPrintingCard(null);
    },
    [addCard]
  );

  // Open printing selector when clicking a card in the deck grid
  const handleDeckCardClick = useCallback(async (deckCard: DeckCard) => {
    try {
      const { getCardByNameFuzzy } = await import("@/lib/scryfall/client");
      const scryfallCard = await getCardByNameFuzzy(deckCard.name);
      setDeckCardForPrinting(deckCard);
      setDeckCardPrintingCard(scryfallCard);
    } catch {
      console.warn("Could not find card:", deckCard.name);
    }
  }, []);

  // Replace deck card with a newly selected printing, preserving category
  const handleDeckCardPrintingSelect = useCallback(
    async (newCard: ScryfallCard) => {
      if (!deckCardForPrinting) return;
      const originalCategory = deckCardForPrinting.category;
      removeCard(deckCardForPrinting.id);
      await addCard(newCard);
      // Restore original category if it differs from the auto-categorized one
      const addedCard = useDeckStore.getState().decks[deckId]?.cards.find(
        (c) => c.name === newCard.name
      );
      if (addedCard && addedCard.category !== originalCategory) {
        updateCardCategory(addedCard.id, originalCategory);
      }
      setDeckCardForPrinting(null);
      setDeckCardPrintingCard(null);
    },
    [deckCardForPrinting, removeCard, addCard, updateCardCategory, deckId]
  );

  // Keyboard shortcuts — global listener
  useKeyboardShortcuts({
    searchResults: searchData?.data ?? [],
    onAddCard: handleCardClick,
    isInputFocused,
  });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: { active: { data: { current?: { card?: ScryfallCard } } } }) => {
    const card = event.active.data.current?.card;
    if (card) setActiveDragCard(card);
  }, []);

  const handleAIAnalyze = useCallback(() => {
    if (!deck || !stats) return;
    analyzeAI(deck, stats, bracketScore);
  }, [deck, stats, bracketScore, analyzeAI]);

  const handleAIAddCard = useCallback((cardName: string) => {
    // Search for the card by name and add it
    // We use getCardByName from Scryfall client
    import("@/lib/scryfall/client").then(({ getCardByName }) => {
      getCardByName(cardName)
        .then((card) => addCard(card))
        .catch(() => console.warn(`Could not find card: ${cardName}`));
    });
  }, [addCard]);

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

  const handleStartEditName = () => {
    setNameInput(deck.name);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== deck.name) await renameDeck(deckId, trimmed);
    setIsEditingName(false);
  };

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
          {isEditingName ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                className="flex-1 text-sm font-semibold bg-transparent border-b border-[var(--accent)] text-[var(--text-primary)] outline-none min-w-0"
                maxLength={200}
                autoFocus
              />
              <button onClick={handleSaveName} className="text-green-400 hover:text-green-300 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditName}
              className="group flex items-center gap-1.5"
              title="Click to rename"
            >
              <h1 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {deck.name}
              </h1>
              <Pencil className="w-3 h-3 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <span className="text-xs text-[var(--text-secondary)]">
            {(deck.cards.length + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0))} / 100
          </span>
          <div className="ml-auto flex items-center gap-2">
            {/* Duplicate deck */}
            <button
              onClick={async () => {
                const newId = await duplicateDeck(deckId);
                router.push(`/builder/${newId}`);
              }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <Copy className="w-3 h-3" />
              Duplicate
            </button>
            {/* Bulk edit — edit deck as plain text */}
            <BulkEditModal deck={deck}>
              <button className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                <FileText className="w-3 h-3" />
                Bulk Edit
              </button>
            </BulkEditModal>
            {/* Export deck */}
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        {/* 3-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel 1: Search (resizable) */}
          <motion.div
            style={{ width: searchPanelWidth, minWidth: 220, maxWidth: 520 }}
            className="shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--surface)] relative"
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
                    {getSearchModeLabel(mode)}
                  </button>
                ))}
              </div>

              {/* Mode-specific controls */}
              {searchMode === "name" && (
                <>
                  <SearchBar
                    onSearch={handleSearch}
                    isLoading={searchLoading}
                    showKeyboardHint={true}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters((f) => !f)}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showFilters ? "Hide filters" : "Show filters"}
                    </button>
                    <button
                      onClick={() => { setCommanderMode((m) => !m); setPartnerMode(false); }}
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
                    {deck && supportsPartner(deck.pairingType) && (
                      <button
                        onClick={() => { setPartnerMode((m) => !m); setCommanderMode(false); }}
                        className={cn(
                          "flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors",
                          partnerMode
                            ? "border-purple-500 text-purple-400 bg-purple-500/10"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                        )}
                        title={`Search for a ${partnerSlotLabel(deck.pairingType)}`}
                      >
                        <Crown className="w-3 h-3" />
                        {partnerSlotLabel(deck.pairingType)}
                      </button>
                    )}
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
                    showKeyboardHint={false}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { code: "W", label: "White" },
                      { code: "U", label: "Blue" },
                      { code: "B", label: "Black" },
                      { code: "R", label: "Red" },
                      { code: "G", label: "Green" },
                      { code: "C", label: "Colorless" },
                    ].map((c) => (
                      <button
                        key={c.code}
                        onClick={() => toggleColorFilter(c.code)}
                        className={cn(
                          "w-9 h-9 rounded-full transition-all border-2 p-0.5",
                          colorFilter.includes(c.code)
                            ? "border-[var(--accent)] scale-110"
                            : "border-transparent opacity-50 hover:opacity-100"
                        )}
                        title={c.label}
                      >
                        {/* Official Scryfall mana symbol SVGs */}
                        <img
                          src={`https://svgs.scryfall.io/card-symbols/${c.code}.svg`}
                          alt={c.label}
                          className="w-full h-full"
                        />
                      </button>
                    ))}
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

          {/* Resize handle between panel 1 and 2 */}
          <div
            role="separator"
            aria-label="Resize search panel"
            aria-orientation="vertical"
            tabIndex={0}
            onMouseDown={handleSearchResize}
            onKeyDown={handleSearchResizeKeyDown}
            className="w-1 shrink-0 cursor-col-resize hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/60 transition-colors group relative z-10"
            title="Drag to resize — use arrow keys to adjust"
          >
            <div className="absolute inset-y-0 -left-0.5 -right-0.5" />
          </div>

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
              onCardClick={handleDeckCardClick}
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
              manualBracket={deck.manualBracket}
              onManualBracketChange={(b) => setManualBracket(b)}
            />

            <GameChangersBadge
              count={stats?.gameChangersCount ?? 0}
              names={stats?.gameChangersList ?? []}
              targetBracket={deck.targetBracket}
            />

            <AISuggestionsPanel
              result={aiResult}
              isLoading={aiLoading}
              error={aiError}
              onAnalyze={handleAIAnalyze}
              onAddCard={handleAIAddCard}
              onRemoveCard={(cardName) => {
                const card = deck?.cards.find((c) => c.name === cardName);
                if (card) removeCard(card.id);
              }}
              disabled={!deck?.commander}
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

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal />

      {/* Export modal */}
      {showExport && deck && (
        <ExportModal deck={deck} onClose={() => setShowExport(false)} />
      )}

      {/* Import modal — controlled via UI store (Cmd+I) */}
      <ImportDialog open={showImportModal} onOpenChange={setShowImportModal} />

      {/* Printing selector modal — for adding a card from search results */}
      {printingCard && (
        <PrintingSelectorModal
          card={printingCard}
          onSelect={handlePrintingSelect}
          onClose={() => setPrintingCard(null)}
        />
      )}

      {/* Printing selector modal — for replacing a deck card's edition/art */}
      {deckCardPrintingCard && (
        <PrintingSelectorModal
          card={deckCardPrintingCard}
          onSelect={handleDeckCardPrintingSelect}
          onClose={() => {
            setDeckCardForPrinting(null);
            setDeckCardPrintingCard(null);
          }}
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
