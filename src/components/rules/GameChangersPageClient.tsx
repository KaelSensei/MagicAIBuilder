"use client";
/**
 * GameChangersPageClient — full paginated list of Game Changers + Commander banlist.
 *
 * - Client-side pagination (data already fetched via TanStack Query / Scryfall)
 * - Page size: 25 (configurable via PAGE_SIZE constant)
 * - URL reflects current page: ?page=N
 * - Scroll to top on page change
 * - Search/filter preserved across pagination
 * - Fully responsive
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, Shield, Zap } from "lucide-react";
import { useGameChangersList } from "@/hooks/useGameChangers";
import { useBanlistQuery } from "@/hooks/useBanlist";
import { Pagination } from "@/components/rules/Pagination";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 25;

type Tab = "game-changers" | "banlist";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface CardRowProps {
  readonly card: ScryfallCard;
  readonly badge?: React.ReactNode;
}

function CardRow({ card, badge }: CardRowProps) {
  const imageUri =
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.small;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40 transition-colors">
      {imageUri && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUri}
          alt={card.name}
          className="w-8 h-11 rounded object-cover shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{card.name}</p>
        <p className="text-xs text-[var(--text-secondary)] truncate">{card.type_line}</p>
      </div>
      {badge}
    </div>
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
      // Scroll to top of list
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

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Title */}
      <div ref={topRef}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Game Changers &amp; Banlist
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Official Commander rules reference — sourced live from Scryfall.
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
            {filtered.length} carte{filtered.length !== 1 ? "s" : ""}
            {search && ` pour « ${search} »`}
          </p>

          {/* Card list */}
          {pageSlice.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pageSlice.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  badge={
                    activeTab === "game-changers" ? (
                      <span className="shrink-0 text-xs text-amber-400 font-medium flex items-center gap-0.5">
                        <Zap className="w-3 h-3" /> GC
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-red-400 font-medium flex items-center gap-0.5">
                        <Shield className="w-3 h-3" /> Banned
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
