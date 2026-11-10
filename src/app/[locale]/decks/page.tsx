"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInitContext } from "@/components/providers/InitProvider";
import { useBoundedSession } from "@/hooks/useBoundedSession";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { AlertTriangle, Layers, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { DeckWizard } from "@/components/deck/DeckWizard";
import { HomeDeckCard } from "@/components/deck/HomeDeckCard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useDeckStore } from "@/lib/deck/store";
import { useToastStore } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { DeckListTable } from "@/components/deck/DeckListTable";
import { DecksHomeControls } from "@/components/deck/DecksHomeControls";
import { DeckComparisonPanel } from "@/components/deck/DeckComparisonPanel";
import { DeckFolderControls } from "@/components/deck/DeckFolderControls";
import { DeckListRefreshNotice } from "@/components/deck/DeckListRefreshNotice";
import { GuestDeckClaimOffer } from "@/components/deck/GuestDeckClaimOffer";
import { LibraryCardSkeleton } from "@/components/layout/RouteSkeleton";
import { Input } from "@/components/ui/Input";
import {
  filterDecksByQuery,
  getStoredDecksViewMode,
  sortDecks,
  storeDecksViewMode,
  type DecksSortDir,
  type DecksSortKey,
  type DecksViewMode,
} from "@/lib/deck/deck-listing";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

export default function DecksPage() {
  const t = useTranslations("deck");
  const { status: sessionStatus, timedOut, retry: retrySession } = useBoundedSession();
  const { initializationStatus, retryInitialization } = useInitContext();
  const router = useRouter();
  const {
    decks,
    createDeck,
    loadDecks,
    isSyncing,
    deleteDeck,
    duplicateDeck,
    loadError,
  } = useDeckStore();
  // Fine-grained selector: `add` is stable, so it can sit in a useCallback dep.
  const addToast = useToastStore((state) => state.add);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DecksViewMode>("grid");
  const [sortKey, setSortKey] = useState<DecksSortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<DecksSortDir>("desc");
  const [folderFilter, setFolderFilter] = useState("all");
  const [query, setQuery] = useState("");
  const deckList = Object.values(decks);
  const showLoading =
    deckList.length === 0 &&
    !timedOut &&
    (sessionStatus === "loading" || (sessionStatus === "authenticated" && isLoading));
  const sessionBlocked = timedOut && deckList.length === 0;
  // A failed listing must not read as an empty account.
  const hasLoadFailed = loadError !== null && deckList.length === 0;
  const sortedDeckList = useMemo(() => {
    const folderFiltered =
      folderFilter === "all"
        ? deckList
        : deckList.filter((deck) => (deck.folderId ?? "") === folderFilter);
    return sortDecks(filterDecksByQuery(folderFiltered, query), sortKey, sortDir);
  }, [deckList, folderFilter, query, sortKey, sortDir]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    void loadDecks().finally(() => setIsLoading(false));
  }, [loadDecks, sessionStatus]);

  useEffect(() => {
    const stored = getStoredDecksViewMode();
    if (stored) setViewMode(stored);
  }, []);

  const handleDeleteDeck = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm(t("home.deleteConfirm"))) {
        return;
      }

      setDeletingId(id);
      try {
        await deleteDeck(id);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteDeck, t]
  );

  const handleDuplicateDeck = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDuplicatingId(id);

      try {
        const newId = await duplicateDeck(id);
        router.push(`/builder/${newId}`);
      } catch (error) {
        logger.error("Unexpected error", "handleDuplicateDeck", error);
        setDuplicatingId(null);
      }
    },
    [duplicateDeck, router]
  );

  const handleNewDeck = useCallback(async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      const name = `New Deck ${deckList.length + 1}`;
      const id = await createDeck(name);
      router.push(`/builder/${id}`);
    } catch (error) {
      // Logging alone made the button look inert: it spun, the request 500'd,
      // and the user was left on the same screen with no explanation.
      logger.error("Unexpected error", "handleNewDeck", error);
      addToast(
        "error",
        t("home.createFailed", {
          reason: error instanceof Error ? error.message : "unknown error",
        })
      );
      setIsCreating(false);
    }
  }, [createDeck, deckList.length, isCreating, router, t, addToast]);

  const handleGuestDeckSaved = useCallback(() => {
    void loadDecks();
  }, [loadDecks]);

  const handleRetryLoad = useCallback(() => {
    setIsLoading(true);
    void loadDecks().finally(() => setIsLoading(false));
  }, [loadDecks]);

  const handleSetViewMode = useCallback((mode: DecksViewMode) => {
    setViewMode(mode);
    storeDecksViewMode(mode);
  }, []);

  const handleSetSort = useCallback((key: DecksSortKey, dir: DecksSortDir) => {
    setSortKey(key);
    setSortDir(dir);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto flex-1 w-full max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {t("home.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {showLoading && t("home.loading")}
              {!showLoading && hasLoadFailed && t("home.loadFailedSubtitle")}
              {!showLoading &&
                !hasLoadFailed &&
                deckList.length === 0 &&
                t("home.empty")}
              {!showLoading &&
                deckList.length > 0 &&
                t("home.deckCount", { count: deckList.length })}
            </p>
          </div>
          {deckList.length > 0 && (
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("home.searchPlaceholder")}
                aria-label={t("home.searchPlaceholder")}
                className="w-full pl-10"
              />
            </div>
          )}
          <DecksHomeControls
            viewMode={viewMode}
            sortKey={sortKey}
            sortDir={sortDir}
            onSetViewMode={handleSetViewMode}
            onSetSort={handleSetSort}
            onOpenWizard={() => setWizardOpen(true)}
            onNewDeck={handleNewDeck}
            disableNewDeck={isCreating || isSyncing}
            isCreating={isCreating}
          />
        </div>

        <GuestDeckClaimOffer
          placement="inline"
          onSaved={handleGuestDeckSaved}
        />

        {sessionBlocked && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-400 opacity-80" />
            <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
              {t("home.sessionTimeoutTitle")}
            </h2>
            <p className="mb-6 max-w-md text-sm text-[var(--text-secondary)]">
              {t("home.sessionTimeoutDescription")}
            </p>
            <button
              type="button"
              onClick={retrySession}
              className="flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <RefreshCw className="h-4 w-4" />
              {t("home.retry")}
            </button>
          </div>
        )}

        {!sessionBlocked && initializationStatus === "error" && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]">
            <p>{t("home.profileLoadFailed")}</p>
            <button
              type="button"
              onClick={retryInitialization}
              className="shrink-0 rounded-[var(--lumen-radius-pill)] border border-[var(--border)] px-3 py-2"
            >
              {t("home.retry")}
            </button>
          </div>
        )}

        {!showLoading && loadError !== null && deckList.length > 0 && (
          <DeckListRefreshNotice onRetry={handleRetryLoad} />
        )}

        {!showLoading && !hasLoadFailed && (
          <>
            <DeckFolderControls
              decks={deckList}
              filterId={folderFilter}
              onFilterChange={setFolderFilter}
              onMoved={loadDecks}
            />
            <DeckComparisonPanel decks={sortedDeckList} />
          </>
        )}

        {showLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKELETON_KEYS.map((key) => (
              <LibraryCardSkeleton key={key} />
            ))}
          </div>
        )}

        {!showLoading && hasLoadFailed && (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertTriangle className="mb-4 h-12 w-12 text-red-400 opacity-80" />
            <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
              {t("home.loadFailedTitle")}
            </h2>
            <p className="mb-2 max-w-md text-sm text-[var(--text-secondary)]">
              {t("home.loadFailedDescription")}
            </p>
            <p className="mb-6 max-w-md break-words font-mono text-xs text-[var(--text-secondary)] opacity-70">
              {loadError}
            </p>
            <button
              type="button"
              onClick={handleRetryLoad}
              className="flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("home.retry")}
            </button>
          </motion.div>
        )}

        {!showLoading && !hasLoadFailed && !sessionBlocked && deckList.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Layers className="mb-4 h-12 w-12 text-[var(--accent-text)] opacity-60" />
            <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
              {t("home.startBuilding")}
            </h2>
            <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
              {t("home.startBuildingDescription")}
            </p>
            <button
              type="button"
              onClick={handleNewDeck}
              disabled={isCreating}
              className="flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t("home.createDeck")}
            </button>
          </motion.div>
        )}

        {!showLoading && deckList.length > 0 && sortedDeckList.length === 0 && (
          <p className="rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--lumen-shadow-sm)]">
            {t("home.searchEmpty")}
          </p>
        )}

        {!showLoading && sortedDeckList.length > 0 && (
          <>
            {viewMode === "list" ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <DeckListTable
                  decks={sortedDeckList}
                  deletingId={deletingId}
                  duplicatingId={duplicatingId}
                  onDelete={handleDeleteDeck}
                  onDuplicate={handleDuplicateDeck}
                />
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.08 } },
                }}
              >
                {sortedDeckList.map((deck) => (
                  <motion.div
                    key={deck.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <HomeDeckCard
                      deck={deck}
                      onDelete={handleDeleteDeck}
                      onDuplicate={handleDuplicateDeck}
                      deletingId={deletingId}
                      duplicatingId={duplicatingId}
                    />
                  </motion.div>
                ))}

                <motion.button
                  onClick={handleNewDeck}
                  disabled={isCreating}
                  className="flex h-40 flex-col items-center justify-center gap-2 rounded-[var(--lumen-radius-xl)] border border-dashed border-[var(--border)] bg-transparent p-5 text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:bg-[var(--surface)] hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  {isCreating ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Plus className="h-6 w-6" />
                  )}
                  <span className="text-sm font-medium">
                    {t("home.newDeck")}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </main>

      <Footer />

      <DeckWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={(id) => {
          setWizardOpen(false);
          router.push(`/builder/${id}`);
        }}
      />
    </div>
  );
}
