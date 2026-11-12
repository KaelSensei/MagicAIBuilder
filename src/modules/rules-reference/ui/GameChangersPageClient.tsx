"use client";
/**
 * The Game Changers and Commander banlist page: two Scryfall lists behind tabs,
 * searched and paged in the browser, with a zoom and a printing selector.
 *
 * Rules reference context, `ui/`. The page composes `CardTile`, the
 * `usePagedFilteredList` hook (search, page slice and the `?page=N` URL sync)
 * and `Pagination`; it keeps the tab state and the two modals. `CardZoomModal`
 * and the tab bar move out in RR-05.
 *
 * @module rules-reference/ui/GameChangersPageClient
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Loader2, Search, Shield, Zap, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocalizedGameChangersList } from "@/hooks/useGameChangers";
import { resolveLocalizedText } from "@/lib/scryfall/localized";
import { useLocalizedBanlistQuery } from "@/hooks/useBanlist";
import { usePagedFilteredList } from "@/modules/rules-reference/client/usePagedFilteredList";
import { CardTile } from "@/modules/rules-reference/ui/CardTile";
import {
  getCardGridImageUri,
  getListedCardImageUri,
} from "@/modules/rules-reference/ui/card-image";
import { Pagination } from "@/modules/rules-reference/ui/Pagination";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** Cards per page. */
const PAGE_SIZE = 25;

type Tab = "game-changers" | "banlist";

/**
 * Whether a card answers the typed search: by its oracle name or by the displayed (printed) one,
 * since a viewer reading a French list types the French name they see on screen.
 * `query` is already trimmed and lower-cased.
 */
function cardMatchesSearch(card: ScryfallCard, query: string): boolean {
  if (card.name.toLowerCase().includes(query)) return true;
  const printed = card.printed_name ?? card.card_faces?.[0]?.printed_name;
  return printed?.toLowerCase().includes(query) ?? false;
}

// ---------------------------------------------------------------------------
// Zoom modal — full-size image with printing selector access
// ---------------------------------------------------------------------------
interface CardZoomModalProps {
  readonly card: ScryfallCard;
  readonly cards: readonly ScryfallCard[];
  readonly onClose: () => void;
  readonly onNavigate: (card: ScryfallCard) => void;
  readonly onOpenPrintings: () => void;
}

function CardZoomModal({
  card,
  cards,
  onClose,
  onNavigate,
  onOpenPrintings,
}: CardZoomModalProps) {
  const t = useTranslations("rules");
  const text = resolveLocalizedText(card);
  const currentIndex = cards.findIndex((c) => c.id === card.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < cards.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(cards[currentIndex - 1]);
  }, [hasPrev, cards, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(cards[currentIndex + 1]);
  }, [hasNext, cards, currentIndex, onNavigate]);

  // Keyboard: Escape to close, Arrow keys to navigate
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  const largeUri =
    getListedCardImageUri(card, "display") ?? getCardGridImageUri(card);

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-transparent p-4"
      aria-label={`${text.name} — zoom`}
    >
      <div className="relative flex h-full w-full max-h-full items-center justify-center">
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-default border-0 bg-black/80 p-0 backdrop-blur-sm"
          aria-label={t("zoom.close")}
          onClick={onClose}
        />

        {hasPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
            aria-label={t("zoom.previousCard")}
          >
            ‹
          </button>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
            aria-label={t("zoom.nextCard")}
          >
            ›
          </button>
        )}

        <div className="relative z-10 w-full max-w-[400px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-lg transition-colors hover:text-[var(--text-primary)]"
            aria-label={t("zoom.closeButton")}
          >
            <X className="w-4 h-4" />
          </button>

          {largeUri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={largeUri}
              alt={text.name}
              className="w-full rounded-xl shadow-2xl"
            />
          )}

          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{text.name}</p>
              <p className="text-xs text-white/60">
                {text.typeLine}
                {cards.length > 1 && (
                  <span className="ml-2 text-white/40">
                    {t("zoom.cardPosition", {
                      current: currentIndex + 1,
                      total: cards.length,
                    })}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPrintings}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              {t("zoom.viewAllArts")}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function GameChangersPageClient() {
  const t = useTranslations("rules");

  const [activeTab, setActiveTab] = useState<Tab>("game-changers");
  const [zoomedCard, setZoomedCard] = useState<ScryfallCard | null>(null);
  const [printingsCard, setPrintingsCard] = useState<ScryfallCard | null>(null);

  // Scryfall queries
  const {
    data: gameChangers,
    isLoading: gcLoading,
    isError: gcError,
  } = useLocalizedGameChangersList();

  const {
    data: banlist,
    isLoading: blLoading,
    isError: blError,
  } = useLocalizedBanlistQuery();

  // Active dataset
  const activeData: ScryfallCard[] = useMemo(() => {
    const raw = activeTab === "game-changers" ? gameChangers : banlist;
    return raw ?? [];
  }, [activeTab, gameChangers, banlist]);

  const isLoading = activeTab === "game-changers" ? gcLoading : blLoading;
  const isError = activeTab === "game-changers" ? gcError : blError;

  const {
    search,
    changeSearch,
    filtered,
    pageSlice,
    currentPage,
    totalPages,
    goToPage,
    topRef,
  } = usePagedFilteredList({
    items: activeData,
    matches: cardMatchesSearch,
    pageSize: PAGE_SIZE,
    isLoading,
    isError,
  });

  // Another list starts over from page 1.
  const selectTab = useCallback(
    (tab: Tab) => {
      if (tab === activeTab) return;
      setActiveTab(tab);
      goToPage(1);
    },
    [activeTab, goToPage]
  );

  const handleZoomClick = useCallback((card: ScryfallCard) => {
    setZoomedCard(card);
  }, []);

  const handleOpenPrintings = useCallback(() => {
    if (zoomedCard) {
      setPrintingsCard(zoomedCard);
      setZoomedCard(null);
    }
  }, [zoomedCard]);

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Zoom modal with carousel navigation */}
      {zoomedCard && (
        <CardZoomModal
          card={zoomedCard}
          cards={pageSlice}
          onClose={() => setZoomedCard(null)}
          onNavigate={setZoomedCard}
          onOpenPrintings={handleOpenPrintings}
        />
      )}

      {/* Printings modal */}
      {printingsCard && (
        <PrintingSelectorModal
          card={printingsCard}
          onSelect={() => setPrintingsCard(null)}
          onClose={() => setPrintingsCard(null)}
        />
      )}

      {/* Title */}
      <div ref={topRef}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t("subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] w-fit">
        <button
          type="button"
          onClick={() => selectTab("game-changers")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
            activeTab === "game-changers"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          {t("tabs.gameChangers")}
          {gameChangers && (
            <span className="ml-1 text-xs opacity-70">
              ({gameChangers.length})
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => selectTab("banlist")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
            activeTab === "banlist"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          {t("tabs.banlist")}
          {banlist && (
            <span className="ml-1 text-xs opacity-70">({banlist.length})</span>
          )}
        </button>
        <Link
          href="/rules/comprehensive"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {t("comprehensive.tabLabel")}
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {t("error")}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Results count */}
          <p className="text-xs text-[var(--text-secondary)]">
            {t("resultsCount", { count: filtered.length })}
            {search && ` ${t("resultsFor", { query: search })}`}
          </p>

          {/* Card grid */}
          {pageSlice.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {pageSlice.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  onClickZoom={handleZoomClick}
                  badge={
                    activeTab === "game-changers" ? (
                      <span className="shrink-0 text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> {t("badges.gc")}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-red-400 font-medium flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> {t("badges.banned")}
                      </span>
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              {t("noCards")}
            </p>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            className="mt-2"
          />
        </>
      )}
    </main>
  );
}
