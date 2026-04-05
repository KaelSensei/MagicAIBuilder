"use client";
// Main builder view — 3-panel layout: Search | DeckEditor | Stats
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Search, LayoutGrid, BarChart3, ArrowLeft, Check, Copy, Dices, Download, FileText, Pencil } from "lucide-react";
import { useDeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
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
import { buildSearchQuery, buildCommanderSearchQuery, buildSetSearchQuery, buildColorSearchQuery, buildPartnerSearchQuery, buildCompanionSearchQuery } from "@/lib/scryfall/search";
import { SetAutocomplete } from "@/components/search/SetAutocomplete";
import type { SearchFilters as Filters, DeckCard, CardCategory, DeckZone } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

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
import { PlaytestModal } from "@/components/playtest/PlaytestModal";
import { MetaPanel } from "@/components/deck/MetaPanel";
import { CollectionStatsPanel } from "@/components/deck/CollectionStatsPanel";
import { DeckVisibilityToggle } from "@/components/deck/DeckVisibilityToggle";
import { useSession } from "next-auth/react";
import { SnapshotsPanel } from "@/components/deck/SnapshotsPanel";
import { BuilderNameSearchModeBar } from "@/components/builder/BuilderNameSearchModeBar";

type SearchMode = "name" | "set" | "color";

function isDeckZone(value: string): value is DeckZone {
  return value === "main" || value === "sideboard" || value === "maybeboard";
}

function getSearchModeLabel(mode: SearchMode): string {
  if (mode === "name") return "Name";
  if (mode === "set") return "By Set";
  return "By Color";
}

interface BuildSearchQueryFromModeParams {
  readonly mode: SearchMode;
  readonly searchText: string;
  readonly filters: Filters;
  readonly selectedSet: string;
  readonly colorFilter: string[];
  readonly commanderMode: boolean;
  readonly partnerMode: boolean;
  readonly companionMode: boolean;
  readonly deckPairingType?: string;
}

/** Build Scryfall search query based on current mode and filters */
function buildSearchQueryFromMode(p: BuildSearchQueryFromModeParams): string {
  if (p.commanderMode) {
    return buildCommanderSearchQuery(p.searchText, p.filters);
  }
  if (p.partnerMode) {
    return buildPartnerSearchQuery(p.deckPairingType ?? "none", p.searchText, p.filters);
  }
  if (p.companionMode) {
    return buildCompanionSearchQuery(p.searchText, p.filters);
  }
  switch (p.mode) {
    case "set":
      return p.selectedSet ? buildSetSearchQuery(p.selectedSet, p.colorFilter) : "";
    case "color":
      return p.colorFilter.length > 0 || p.searchText
        ? buildColorSearchQuery(p.colorFilter, p.searchText)
        : "";
    default:
      return buildSearchQuery(p.searchText, p.filters);
  }
}

type CardClickHandlers = {
  setCommander: (card: ScryfallCard) => void;
  setPartner: (card: ScryfallCard) => void;
  setCompanion: (card: ScryfallCard) => Promise<void>;
  setPrintingCard: (card: ScryfallCard | null) => void;
};

/** Handle search result card click based on current mode */
function handleSearchResultCardClick(
  card: ScryfallCard,
  handlers: CardClickHandlers,
  commanderMode: boolean,
  partnerMode: boolean,
  companionMode: boolean,
  deckPairingType?: string
): void {
  if (commanderMode) {
    const isBackgroundCard = (card.type_line ?? "").toLowerCase().includes("background");
    if (deckPairingType === "background" && isBackgroundCard) {
      handlers.setPartner(card);
      return;
    }
    handlers.setCommander(card);
    return;
  }
  if (partnerMode) {
    handlers.setPartner(card);
    return;
  }
  if (companionMode) {
    void handlers.setCompanion(card);
    return;
  }
  handlers.setPrintingCard(card);
}

/** Determine drop zone from drop target ID */
function getDropZoneFromId(overId: string, defaultZone: DeckZone): DeckZone {
  if (overId === "deck-zone-sideboard") return "sideboard";
  if (overId === "deck-zone-maybeboard") return "maybeboard";
  if (overId.startsWith("deck-panel-")) {
    const zone = overId.slice("deck-panel-".length);
    return isDeckZone(zone) ? zone : defaultZone;
  }
  return defaultZone;
}

/** Get category name from drop target ID if it's a category drop */
function getCategoryFromDropId(overId: string): string | null {
  if (overId.startsWith("deck-category-")) {
    return overId.replace("deck-category-", "");
  }
  return null;
}

const DEFAULT_FILTERS: Filters = {
  colors: [],
  colorMode: "or",
  colorlessFilter: false,
  landFilter: false,
  types: [],
  cmcMode: "range",
  cmcMin: null,
  cmcMax: null,
  cmcExact: null,
  priceMin: null,
  priceMax: null,
  subtype: "",
  keyword: "",
  powerMin: null,
  powerMax: null,
  toughnessMin: null,
  toughnessMax: null,
  interactionType: null,
};

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;
  const { data: sessionData } = useSession();

  // Ensure this deck is active
  const { setActiveDeck, addCard, removeCard, setCommander, setPartner, setCompanion, updateCardCategory } = useDeck();
  const renameDeck = useDeckStore((s) => s.renameDeck);
  const duplicateDeck = useDeckStore((s) => s.duplicateDeck);
  const addToMaybeboard = useDeckStore((s) => s.addToMaybeboard);
  const handleDuplicate = useCallback(async () => {
    const newId = await duplicateDeck(deckId);
    router.push(`/builder/${newId}`);
  }, [duplicateDeck, deckId, router]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-run when deckId changes; loadDecks is stable
  }, [deckId]);

  const { stats } = useDeck();
  const { data: combos, isLoading: combosLoading } = useCombos(deck);
  const bracketScore = useBracketScore(deck, combos);
  const { result: aiResult, isLoading: aiLoading, error: aiError, analyze: analyzeAI, detectedArchetype, analysedAt, ignoredSuggestions, ignoreSuggestion, clearIgnored } = useAISuggestions();

  // Active zone state — lifted from DeckEditor so card adds target the right zone
  const [activeZone, setActiveZone] = useState<DeckZone>("main");

  // Mobile panel state — which panel is visible on small screens
  const [mobilePanel, setMobilePanel] = useState<"search" | "deck" | "stats">("deck");

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
  const [companionMode, setCompanionMode] = useState(false);

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
  const [showPlaytest, setShowPlaytest] = useState(false);
  const [printingCard, setPrintingCard] = useState<ScryfallCard | null>(null);
  const [isBanlistAlertDismissed, setIsBanlistAlertDismissed] = useState(false);

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

  const banlistAlertKey = useMemo(() => {
    if (!stats) {
      return "";
    }

    return `${stats.bannedCards.join("\u0000")}::${stats.colorIdentityViolations.join("\u0000")}`;
  }, [stats]);

  useEffect(() => {
    setIsBanlistAlertDismissed(false);
  }, [banlistAlertKey]);

  const query = buildSearchQueryFromMode({
    mode: searchMode,
    searchText,
    filters,
    selectedSet,
    colorFilter,
    commanderMode,
    partnerMode,
    companionMode,
    deckPairingType: deck?.pairingType,
  });

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
      handleSearchResultCardClick(
        card,
        { setCommander, setPartner, setCompanion, setPrintingCard },
        commanderMode,
        partnerMode,
        companionMode,
        deck?.pairingType
      );
    },
    [setCommander, setPartner, setCompanion, commanderMode, partnerMode, companionMode, deck?.pairingType]
  );

  const handlePrintingSelect = useCallback(
    (card: ScryfallCard) => {
      addCard(card, undefined, activeZone);
      setPrintingCard(null);
    },
    [addCard, activeZone]
  );

  // Open printing selector when clicking a card in the deck grid
  const handleDeckCardClick = useCallback(async (deckCard: DeckCard) => {
    try {
      const { getCardByNameFuzzy } = await import("@/lib/scryfall/client");
      const scryfallCard = await getCardByNameFuzzy(deckCard.name);
      setDeckCardForPrinting(deckCard);
      setDeckCardPrintingCard(scryfallCard);
    } catch {
      logger.warn("Could not find card", "builder", deckCard.name);
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

  const [aiArchetypeOverride, setAIArchetypeOverride] = useState<import("@/lib/ai/archetypes").Archetype | null>(null);
  const [aiBudgetPerCard, setAIBudgetPerCard] = useState<number | null>(null);

  const handleAIAnalyze = useCallback(() => {
    if (!deck || !stats) return;
    analyzeAI(deck, stats, bracketScore, {
      archetypeOverride: aiArchetypeOverride,
      budgetPerCard: aiBudgetPerCard,
    });
  }, [deck, stats, bracketScore, analyzeAI, aiArchetypeOverride, aiBudgetPerCard]);

  const handleSnapshotRestore = useCallback(() => {
    // Reload all decks from DB so the builder reflects the restored state
    loadDecks();
  }, [loadDecks]);

  const handleAIAddCard = useCallback((cardName: string) => {
    // Search for the card by name and add it
    // We use getCardByName from Scryfall client
    import("@/lib/scryfall/client").then(({ getCardByName }) => {
      getCardByName(cardName)
        .then((card) => addCard(card))
        .catch(() => logger.warn("Could not find card", "builder", cardName));
    });
  }, [addCard]);

  const dropSearchCard = useCallback(
    (searchCard: ScryfallCard, overId: string) => {
      const zone = getDropZoneFromId(overId, activeZone);
      addCard(searchCard, undefined, zone);
    },
    [addCard, activeZone]
  );

  const moveIntraDeck = useCallback(
    (cardId: string, overId: string, sourceCategory: string | undefined, deckCards: readonly DeckCard[]) => {
      const categoryFromDrop = getCategoryFromDropId(overId);
      if (categoryFromDrop && categoryFromDrop !== sourceCategory) {
        updateCardCategory(cardId, categoryFromDrop as CardCategory);
        return;
      }

      if (overId.startsWith("deck-card-")) {
        const targetCardId = overId.replace("deck-card-", "");
        const targetCard = deckCards.find((c) => c.id === targetCardId);
        if (targetCard && targetCard.category !== sourceCategory) {
          updateCardCategory(cardId, targetCard.category);
        }
      }
    },
    [updateCardCategory]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragCard(null);
      const { active, over } = event;
      if (!over) return;

      const overId = over.id.toString();
      const searchCard = active.data.current?.card as ScryfallCard | undefined;
      if (searchCard) {
        dropSearchCard(searchCard, overId);
        return;
      }

      const cardId = active.data.current?.cardId as string | undefined;
      if (cardId) {
        const sourceCategory = active.data.current?.sourceCategory as string | undefined;
        moveIntraDeck(cardId, overId, sourceCategory, deck?.cards ?? []);
      }
    },
    [dropSearchCard, moveIntraDeck, deck]
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
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <Header deckId={deckId} />

        {/* Deck title bar */}
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-3 md:px-4 py-2 flex items-center gap-2 md:gap-3">
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
          {deck.isAIGenerated && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              ✨ AI
            </span>
          )}
          <span className="text-xs text-[var(--text-secondary)]">
            {(deck.cards.filter((c) => c.zone === "main").reduce((s, c) => s + c.quantity, 0) + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0))} / 100
          </span>
          <div className="ml-auto flex items-center gap-1 md:gap-2">
            {/* Duplicate deck */}
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 text-xs px-1.5 md:px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              title="Duplicate deck"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
            {/* Bulk edit — edit deck as plain text */}
            <BulkEditModal deck={deck}>
              <button className="flex items-center gap-1.5 text-xs px-1.5 md:px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Bulk edit">
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Bulk Edit</span>
              </button>
            </BulkEditModal>
            {/* Playtest deck */}
            <button
              onClick={() => setShowPlaytest(true)}
              className="flex items-center gap-1.5 text-xs px-1.5 md:px-2.5 py-1 rounded border border-[var(--border)] hover:border-purple-500 text-[var(--text-secondary)] hover:text-purple-400 transition-all"
              title="Playtest this deck"
            >
              <Dices className="w-3 h-3" />
              <span className="hidden sm:inline">Playtest</span>
            </button>
            {/* Export deck */}
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 text-xs px-1.5 md:px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              title="Export deck"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {/* Visibility toggle — public / private */}
            <DeckVisibilityToggle
              deckId={deckId}
              initialIsPublic={deck.isPublic ?? false}
              username={(sessionData?.user as { username?: string } | undefined)?.username}
              className="hidden sm:flex"
            />
          </div>
        </div>

        {/* 3-panel layout — desktop: side-by-side, mobile: tabbed */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Panel 1: Search (resizable on desktop, full-width on mobile) */}
          <motion.div
            style={{ width: searchPanelWidth, minWidth: 220, maxWidth: 520 }}
            className={cn(
              "shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--surface)] relative",
              "max-lg:absolute max-lg:inset-0 max-lg:w-full max-lg:z-20 max-lg:border-r-0",
              mobilePanel !== "search" && "max-lg:hidden"
            )}
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
                    <div className="ml-auto">
                      <BuilderNameSearchModeBar
                        deck={deck}
                        commanderMode={commanderMode}
                        partnerMode={partnerMode}
                        companionMode={companionMode}
                        onToggleCommander={() => {
                          setCommanderMode((m) => !m);
                          setPartnerMode(false);
                          setCompanionMode(false);
                        }}
                        onTogglePartner={() => {
                          setPartnerMode((m) => !m);
                          setCommanderMode(false);
                          setCompanionMode(false);
                        }}
                        onToggleCompanion={() => {
                          setCompanionMode((m) => !m);
                          setCommanderMode(false);
                          setPartnerMode(false);
                        }}
                      />
                    </div>
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
                        {/* Official Scryfall mana symbol SVGs — SVG external URL, next/image not applicable */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                error={searchError instanceof Error ? searchError : null}
                totalCards={searchData?.total_cards}
                onCardClick={handleCardClick}
                onAddToMaybeboard={addToMaybeboard}
                draggable={true}
              />
            </div>
          </motion.div>

          {/* Resize handle between panel 1 and 2 — hidden on mobile */}
          <div
            role="slider"
            aria-label="Search panel width"
            aria-orientation="horizontal"
            aria-valuemin={220}
            aria-valuemax={520}
            aria-valuenow={searchPanelWidth}
            tabIndex={0}
            onMouseDown={handleSearchResize}
            onKeyDown={handleSearchResizeKeyDown}
            className="hidden lg:block w-1 shrink-0 cursor-col-resize hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/60 transition-colors group relative z-10"
            title="Drag to resize — use arrow keys to adjust"
          >
            <div className="absolute inset-y-0 -left-0.5 -right-0.5" />
          </div>

          {/* Panel 2: Deck Editor (flex-1) */}
          <motion.div
            className={cn(
              "flex-1 border-r border-[var(--border)] flex flex-col overflow-hidden",
              "max-lg:absolute max-lg:inset-0 max-lg:border-r-0",
              mobilePanel !== "deck" && "max-lg:hidden"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Banlist alert */}
            {stats && !isBanlistAlertDismissed && (stats.bannedCards.length > 0 || stats.colorIdentityViolations.length > 0) && (
              <div className="p-3 border-b border-[var(--border)]">
                <BanlistAlert
                  bannedCards={stats.bannedCards}
                  colorViolations={stats.colorIdentityViolations}
                  onDismiss={() => setIsBanlistAlertDismissed(true)}
                />
              </div>
            )}

            <DeckEditor
              deck={deck}
              onRemoveCard={removeCard}
              onCardClick={handleDeckCardClick}
              className="flex-1 overflow-hidden"
              activeZone={activeZone}
              onActiveZoneChange={setActiveZone}
            />
          </motion.div>

          {/* Panel 3: Stats (280px on desktop, full-width on mobile) */}
          <motion.div
            className={cn(
              "w-[280px] shrink-0 flex flex-col bg-[var(--surface)] overflow-y-auto p-3 gap-3",
              "max-lg:absolute max-lg:inset-0 max-lg:w-full",
              mobilePanel !== "stats" && "max-lg:hidden"
            )}
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

            <SnapshotsPanel
              deckId={deckId}
              currentCardCount={deck.cards.length}
              onRestore={handleSnapshotRestore}
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
              detectedArchetype={detectedArchetype}
              archetypeOverride={aiArchetypeOverride}
              onArchetypeChange={setAIArchetypeOverride}
              budgetPerCard={aiBudgetPerCard}
              onBudgetPerCardChange={setAIBudgetPerCard}
              analysedAt={analysedAt}
              ignoredSuggestions={ignoredSuggestions}
              onIgnoreSuggestion={ignoreSuggestion}
              onClearIgnored={clearIgnored}
            />

            <CombosPanel
              combos={combos}
              isLoading={combosLoading}
              isEnabled={(deck?.cards.length ?? 0) >= 10}
            />

            <MetaPanel
              commanderName={deck.commander?.name ?? null}
              deckCardNames={new Set(deck.cards.map((c) => c.name))}
              onAddCard={handleAIAddCard}
            />

            <CollectionStatsPanel deck={deck} />

            <DeckStats stats={stats} targetBracket={deck.targetBracket} />
          </motion.div>

          {/* Mobile bottom tab bar */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--surface)] flex">
            {([
              { id: "search" as const, icon: Search, label: "Search" },
              { id: "deck" as const, icon: LayoutGrid, label: "Deck" },
              { id: "stats" as const, icon: BarChart3, label: "Stats" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobilePanel(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  mobilePanel === tab.id
                    ? "text-[var(--accent)] border-t-2 border-[var(--accent)] -mt-px"
                    : "text-[var(--text-secondary)]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer />

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal />

      {/* Playtest modal */}
      {showPlaytest && deck && (
        <PlaytestModal deck={deck} onClose={() => setShowPlaytest(false)} />
      )}

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
