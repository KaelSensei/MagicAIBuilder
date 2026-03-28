"use client";
/**
 * GameChangersPageClient — full paginated list of Game Changers + Commander banlist.
 *
 * - Client-side pagination (data fetched via TanStack Query / Scryfall)
 * - Page size: 25 (configurable via PAGE_SIZE constant)
 * - URL reflects current page: ?page=N
 * - Scroll to top on page change
 * - Card grid with normal-sized images, click-to-zoom, printing selector
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, Shield, Zap, X } from "lucide-react";
import { useGameChangersList } from "@/hooks/useGameChangers";
import { useBanlistQuery } from "@/hooks/useBanlist";
import { Pagination } from "@/components/rules/Pagination";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 25;

type Tab = "game-changers" | "banlist";

// ---------------------------------------------------------------------------
// Card component — grid tile with normal-sized image
// ---------------------------------------------------------------------------
interface CardTileProps {
  readonly card: ScryfallCard;
  readonly badge: React.ReactNode;
  readonly onClickZoom: (card: ScryfallCard) => void;
}

function getCardNormalImage(card: ScryfallCard): string {
  return (
    card.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.normal ??
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.small ??
    ""
  );
}

function CardTile({ card, badge, onClickZoom }: CardTileProps) {
  const imageUri = getCardNormalImage(card);

  return (
    <button
      type="button"
      className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)]/50 transition-colors cursor-pointer text-left w-full"
      onClick={() => onClickZoom(card)}
      aria-label={`View ${card.name}`}
    >
      {/* Card image — aspect ratio ~63:88 */}
      <div className="relative aspect-[63/88] bg-[var(--background)] overflow-hidden">
        {imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUri}
            alt={card.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">
            No image
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="p-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{card.name}</p>
          <p className="text-[10px] text-[var(--text-secondary)] truncate">{card.type_line}</p>
        </div>
        {badge}
      </div>
    </button>
  );
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

function CardZoomModal({ card, cards, onClose, onNavigate, onOpenPrintings }: CardZoomModalProps) {
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
    card.image_uris?.large ??
    card.card_faces?.[0]?.image_uris?.large ??
    getCardNormalImage(card);

  return (
    <dialog
      open
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm w-full h-full max-w-none max-h-none m-0 border-none"
      onClick={onClose}
      aria-label={`${card.name} — zoom`}
    >
      {/* Previous arrow */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          aria-label="Previous card"
        >
          ‹
        </button>
      )}

      {/* Next arrow */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          aria-label="Next card"
        >
          ›
        </button>
      )}

      <div
        className="relative max-w-[400px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Large image */}
        {largeUri && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={largeUri}
            alt={card.name}
            className="w-full rounded-xl shadow-2xl"
          />
        )}

        {/* Card info + nav counter + printings button */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{card.name}</p>
            <p className="text-xs text-white/60">
              {card.type_line}
              {cards.length > 1 && (
                <span className="ml-2 text-white/40">
                  {currentIndex + 1} / {cards.length}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onOpenPrintings}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors"
          >
            View all arts
          </button>
        </div>
      </div>
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function GameChangersPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("game-changers");
  const [search, setSearch] = useState("");
  const [zoomedCard, setZoomedCard] = useState<ScryfallCard | null>(null);
  const [printingsCard, setPrintingsCard] = useState<ScryfallCard | null>(null);

  // Read initial page from URL
  const urlPage = Number(searchParams.get("page") ?? "1");
  const [currentPage, setCurrentPage] = useState(urlPage > 0 ? urlPage : 1);

  // Scryfall queries
  const {
    data: gameChangers,
    isLoading: gcLoading,
    isError: gcError,
  } = useGameChangersList();

  const {
    data: banlist,
    isLoading: blLoading,
    isError: blError,
  } = useBanlistQuery();

  // Active dataset
  const activeData: ScryfallCard[] = useMemo(() => {
    const raw = activeTab === "game-changers" ? gameChangers : banlist;
    return raw ?? [];
  }, [activeTab, gameChangers, banlist]);

  // Filtered dataset (search)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeData;
    return activeData.filter((c) => c.name.toLowerCase().includes(q));
  }, [activeData, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  // Sync URL when page changes
  const updatePage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.replace(`?${params.toString()}`, { scroll: false });
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [router, searchParams]
  );

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    updatePage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search]);

  const isLoading = activeTab === "game-changers" ? gcLoading : blLoading;
  const isError = activeTab === "game-changers" ? gcError : blError;

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
          Game Changers &amp; Banlist
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Official Commander rules reference — sourced live from Scryfall. Click a card to zoom.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] w-fit">
        <button
          onClick={() => setActiveTab("game-changers")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
            activeTab === "game-changers"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Game Changers
          {gameChangers && (
            <span className="ml-1 text-xs opacity-70">({gameChangers.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("banlist")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
            activeTab === "banlist"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          Banlist
          {banlist && (
            <span className="ml-1 text-xs opacity-70">({banlist.length})</span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="search"
          placeholder="Rechercher une carte…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Chargement depuis Scryfall…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Impossible de charger les données depuis Scryfall. Réessaie dans un instant.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Results count */}
          <p className="text-xs text-[var(--text-secondary)]">
            {filtered.length} carte{filtered.length === 1 ? "" : "s"}
            {search && ` pour « ${search} »`}
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
                        <Zap className="w-2.5 h-2.5" /> GC
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-red-400 font-medium flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Banned
                      </span>
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              Aucune carte trouvée.
            </p>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={updatePage}
            className="mt-2"
          />
        </>
      )}
    </main>
  );
}
