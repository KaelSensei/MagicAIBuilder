"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Layers, Loader2, Plus } from "lucide-react";
import { DeckWizard } from "@/components/deck/DeckWizard";
import { HomeDeckCard } from "@/components/deck/HomeDeckCard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useDeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
import { DeckListTable } from "@/components/deck/DeckListTable";
import { DecksHomeControls } from "@/components/deck/DecksHomeControls";
import {
  getStoredDecksViewMode,
  sortDecks,
  storeDecksViewMode,
  type DecksSortDir,
  type DecksSortKey,
  type DecksViewMode,
} from "@/lib/deck/deck-listing";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

function DeckCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-4 w-2/3 rounded bg-[var(--border)]" />
        <div className="ml-2 h-4 w-16 rounded bg-[var(--border)]" />
      </div>
      <div className="mt-2 h-3 w-1/2 rounded bg-[var(--border)]" />
      <div className="mt-2 h-3 w-1/3 rounded bg-[var(--border)]" />
      <div className="mt-3 h-3 w-1/4 rounded bg-[var(--border)]" />
    </div>
  );
}

export default function DecksPage() {
  const t = useTranslations("deck");
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const { decks, createDeck, loadDecks, isSyncing, deleteDeck, duplicateDeck } =
    useDeckStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DecksViewMode>("grid");
  const [sortKey, setSortKey] = useState<DecksSortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<DecksSortDir>("desc");
  const deckList = Object.values(decks);
  const sortedDeckList = useMemo(
    () => sortDecks(deckList, sortKey, sortDir),
    [deckList, sortKey, sortDir]
  );

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    loadDecks().finally(() => setIsLoading(false));
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
      logger.error("Unexpected error", "handleNewDeck", error);
      setIsCreating(false);
    }
  }, [createDeck, deckList.length, isCreating, router]);

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {t("home.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {isLoading && t("home.loading")}
              {!isLoading && deckList.length === 0 && t("home.empty")}
              {!isLoading &&
                deckList.length > 0 &&
                t("home.deckCount", { count: deckList.length })}
            </p>
          </div>
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

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKELETON_KEYS.map((key) => (
              <DeckCardSkeleton key={key} />
            ))}
          </div>
        )}

        {!isLoading && deckList.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Layers className="mb-4 h-12 w-12 text-[var(--accent)] opacity-60" />
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
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
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

        {!isLoading && deckList.length > 0 && (
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
                  className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-transparent p-5 text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:bg-[var(--surface)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
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
