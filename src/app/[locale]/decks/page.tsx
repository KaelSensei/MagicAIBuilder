"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
import { useDeckCreateFailureReport } from "@/hooks/useDeckFailureReport";
import { useDeckDuplication } from "@/hooks/useDeckDuplication";
import { DeckListTable } from "@/components/deck/DeckListTable";
import { DecksHomeControls } from "@/components/deck/DecksHomeControls";
import { DeckCardFilterFields } from "@/components/deck/DeckCardFilterFields";
import { DeckComparisonPanel } from "@/components/deck/DeckComparisonPanel";
import { useLibraryCardSearch } from "@/hooks/useLibraryCardSearch";
import {
  hasCardFilter,
  librarySourceDecks,
  NO_CARD_FILTER,
} from "@/lib/deck/library-card-filter";
import { DeckFolderControls } from "@/components/deck/DeckFolderControls";
import { DeckListRefreshNotice } from "@/components/deck/DeckListRefreshNotice";
import { GuestDeckClaimOffer } from "@/components/deck/GuestDeckClaimOffer";
import { NewDeckFormatSelect } from "@/components/deck/NewDeckFormatSelect";
import { LibraryCardSkeleton } from "@/components/layout/RouteSkeleton";
import { Input } from "@/components/ui/Input";
import { deriveLibraryView } from "@/lib/deck/deck-library-view";
import type { DeckFormat } from "@/lib/deck/formats";
import type { Deck } from "@/lib/deck/types";
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
  const { decks, createDeck, loadDecks, isSyncing, deleteDeck, loadError } =
    useDeckStore();
  const reportCreateFailure = useDeckCreateFailureReport();
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckFormat, setNewDeckFormat] = useState<DeckFormat>("commander");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DecksViewMode>("grid");
  const [sortKey, setSortKey] = useState<DecksSortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<DecksSortDir>("desc");
  const [folderFilter, setFolderFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [cardFilter, setCardFilter] = useState(NO_CARD_FILTER);
  const { search: cardSearch, refresh: refreshCardSearch } =
    useLibraryCardSearch(cardFilter);
  // A deck deleted elsewhere leaves the list and the card search's results, as after a delete here.
  const refreshLibrary = useCallback(async () => {
    refreshCardSearch();
    await loadDecks();
  }, [loadDecks, refreshCardSearch]);
  const duplicateDeck = useDeckDuplication({ onMissing: refreshLibrary });
  const deckList = Object.values(decks);
  // A found card search replaces the loaded page; folder, name and sort follow.
  const sourceDecks = librarySourceDecks(deckList, cardSearch);
  const sortedDeckList = useMemo(() => {
    const folderFiltered =
      folderFilter === "all"
        ? sourceDecks
        : sourceDecks.filter((deck) => (deck.folderId ?? "") === folderFilter);
    return sortDecks(filterDecksByQuery(folderFiltered, query), sortKey, sortDir);
  }, [sourceDecks, folderFilter, query, sortKey, sortDir]);
  // The precedence between the six screens lives in `deriveLibraryView`.
  const libraryView = deriveLibraryView({
    sessionStatus,
    sessionTimedOut: timedOut,
    isLoadingDecks: isLoading,
    loadError,
    decks: deckList,
    visibleDecks: sortedDeckList,
  });

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
        refreshCardSearch();
      } finally {
        setDeletingId(null);
      }
    },
    [deleteDeck, refreshCardSearch, t]
  );

  const handleDuplicateDeck = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDuplicatingId(id);
      // On success the builder opens on the copy, so the spinner stays.
      if (!(await duplicateDeck(id))) setDuplicatingId(null);
    },
    [duplicateDeck]
  );

  const handleNewDeck = useCallback(async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      // Stored once, in the creator's locale; renaming stays the user's call.
      const name = t("home.newDeckName", { index: deckList.length + 1 });
      const id = await createDeck(name, { format: newDeckFormat });
      router.push(`/builder/${id}`);
    } catch (error) {
      reportCreateFailure("handleNewDeck", error);
      setIsCreating(false);
    }
  }, [
    createDeck,
    deckList.length,
    isCreating,
    newDeckFormat,
    router,
    t,
    reportCreateFailure,
  ]);

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

  // The folder filter and the comparison panel sit above every screen that
  // has a library to show, the session timeout included, as they always did.
  const libraryControls = (
    <>
      <DeckFolderControls
        decks={deckList}
        filterId={folderFilter}
        onFilterChange={setFolderFilter}
        onMoved={loadDecks}
      />
      <DeckComparisonPanel decks={sortedDeckList} />
    </>
  );

  function librarySubtitle(): string {
    switch (libraryView.kind) {
      case "loading":
        return t("home.loading");
      case "loadFailed":
        return t("home.loadFailedSubtitle");
      // The timeout still reads as an empty library: pinned by the page's
      // tests, and the P1-20 follow-up owns the wording.
      case "sessionBlocked":
      case "empty":
        return t("home.empty");
      case "searchEmpty":
      case "ready":
        return t("home.deckCount", { count: libraryView.deckCount });
      default: {
        const unreachable: never = libraryView;
        return unreachable;
      }
    }
  }

  function renderLibraryBody(): ReactNode {
    switch (libraryView.kind) {
      case "loading":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKELETON_KEYS.map((key) => (
              <LibraryCardSkeleton key={key} />
            ))}
          </div>
        );
      case "sessionBlocked":
        return (
          <>
            <SessionTimeoutPanel onRetry={retrySession} />
            {libraryControls}
          </>
        );
      case "loadFailed":
        return (
          <LoadFailedPanel
            error={libraryView.error}
            onRetry={handleRetryLoad}
          />
        );
      case "empty":
        return (
          <>
            {libraryControls}
            <EmptyLibraryPanel
              onCreate={handleNewDeck}
              isCreating={isCreating}
            />
          </>
        );
      case "searchEmpty":
        return (
          <>
            {libraryView.refreshFailed && (
              <DeckListRefreshNotice onRetry={handleRetryLoad} />
            )}
            {libraryControls}
            <p className="rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--lumen-shadow-sm)]">
              {hasCardFilter(cardFilter)
                ? t("home.cardFilter.searchEmpty")
                : t("home.searchEmpty")}
            </p>
          </>
        );
      case "ready":
        return (
          <>
            {libraryView.refreshFailed && (
              <DeckListRefreshNotice onRetry={handleRetryLoad} />
            )}
            {libraryControls}
            {renderDeckViews(libraryView.decks)}
          </>
        );
      default: {
        const unreachable: never = libraryView;
        return unreachable;
      }
    }
  }

  function renderDeckViews(visibleDecks: readonly Deck[]): ReactNode {
    if (viewMode === "list") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DeckListTable
            decks={visibleDecks}
            deletingId={deletingId}
            duplicatingId={duplicatingId}
            onDelete={handleDeleteDeck}
            onDuplicate={handleDuplicateDeck}
          />
        </motion.div>
      );
    }
    return (
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {visibleDecks.map((deck) => (
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
          <span className="text-sm font-medium">{t("home.newDeck")}</span>
        </motion.button>
      </motion.div>
    );
  }

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
              {librarySubtitle()}
            </p>
          </div>
          {/* The search box belongs to the two screens that have decks to search. */}
          {(libraryView.kind === "searchEmpty" ||
            libraryView.kind === "ready") && (
            <div className="flex w-full flex-col gap-3 lg:max-w-sm">
              <div className="relative w-full">
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
              <DeckCardFilterFields
                filter={cardFilter}
                onChange={setCardFilter}
                search={cardSearch}
              />
            </div>
          )}
          <NewDeckFormatSelect
            value={newDeckFormat}
            onChange={setNewDeckFormat}
          />
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

        {libraryView.kind !== "sessionBlocked" &&
          initializationStatus === "error" && (
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

        {renderLibraryBody()}
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

/** The session request timed out: nothing is listed until it is asked again. */
function SessionTimeoutPanel({ onRetry }: { readonly onRetry: () => void }) {
  const t = useTranslations("deck");
  return (
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
        onClick={onRetry}
        className="flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        <RefreshCw className="h-4 w-4" />
        {t("home.retry")}
      </button>
    </div>
  );
}

/**
 * The listing failed with no deck to fall back on. A failed listing must not
 * read as an empty account, so the raw error is shown with a reload.
 */
function LoadFailedPanel({
  error,
  onRetry,
}: {
  readonly error: string;
  readonly onRetry: () => void;
}) {
  const t = useTranslations("deck");
  return (
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
        {error}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      >
        <RefreshCw className="h-4 w-4" />
        {t("home.retry")}
      </button>
    </motion.div>
  );
}

/** The library holds no deck: the first one is one click away. */
function EmptyLibraryPanel({
  onCreate,
  isCreating,
}: {
  readonly onCreate: () => void;
  readonly isCreating: boolean;
}) {
  const t = useTranslations("deck");
  return (
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
        onClick={onCreate}
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
  );
}
