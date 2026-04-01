"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, Loader2, Plus, Sparkles } from "lucide-react";
import { DeckWizard } from "@/components/deck/DeckWizard";
import { HomeDeckCard } from "@/components/deck/HomeDeckCard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useDeckStore } from "@/lib/deck/store";
import { DeckListTable } from "@/components/deck/DeckListTable";
import {
  getStoredDecksViewMode,
  sortDecks,
  storeDecksViewMode,
  type DecksSortDir,
  type DecksSortKey,
  type DecksViewMode,
} from "@/lib/deck/deck-listing";

function getDeckSubtitle(isLoading: boolean, count: number): string {
  if (isLoading) {
    return "Loading...";
  }

  if (count === 0) {
    return "No decks yet - create your first deck!";
  }

  return `${count} deck${count > 1 ? "s" : ""}`;
}

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

export default function HomePage() {
  const router = useRouter();
  const { decks, createDeck, loadDecks, isSyncing, deleteDeck, duplicateDeck } = useDeckStore();
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
    loadDecks().finally(() => setIsLoading(false));
  }, [loadDecks]);

  useEffect(() => {
    const stored = getStoredDecksViewMode();
    if (stored) setViewMode(stored);
  }, []);

  const handleDeleteDeck = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this deck? This cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDeck(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicateDeck = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDuplicatingId(id);

    try {
      const newId = await duplicateDeck(id);
      router.push(`/builder/${newId}`);
    } catch (error) {
      console.error("[handleDuplicateDeck]", error);
      setDuplicatingId(null);
    }
  };

  const handleNewDeck = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      const name = `New Deck ${deckList.length + 1}`;
      const id = await createDeck(name);
      router.push(`/builder/${id}`);
    } catch (error) {
      console.error("[handleNewDeck]", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto flex-1 w-full max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Decks</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {getDeckSubtitle(isLoading, deckList.length)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="inline-flex overflow-hidden rounded-lg border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("grid");
                    storeDecksViewMode("grid");
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === "grid"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                  aria-pressed={viewMode === "grid"}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    storeDecksViewMode("list");
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                  aria-pressed={viewMode === "list"}
                >
                  List
                </button>
              </div>

              <select
                value={`${sortKey}:${sortDir}`}
                onChange={(e) => {
                  const [k, d] = e.target.value.split(":");
                  if (k === "updatedAt" || k === "name" || k === "bracket") {
                    setSortKey(k);
                  }
                  if (d === "asc" || d === "desc") {
                    setSortDir(d);
                  }
                }}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                aria-label="Sort decks"
              >
                <option value="updatedAt:desc">Updated (newest)</option>
                <option value="updatedAt:asc">Updated (oldest)</option>
                <option value="name:asc">Name (A–Z)</option>
                <option value="name:desc">Name (Z–A)</option>
                <option value="bracket:asc">Bracket (low→high)</option>
                <option value="bracket:desc">Bracket (high→low)</option>
              </select>
            </div>
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
            >
              <Sparkles className="h-4 w-4" />
              Build with AI
            </button>
            <button
              onClick={handleNewDeck}
              disabled={isCreating || isSyncing}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              New Deck
            </button>
          </div>
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
              Start building
            </h2>
            <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
              Create your first Commander deck with live bracket scoring and
              Game Changers detection.
            </p>
            <button
              onClick={handleNewDeck}
              disabled={isCreating}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Deck
            </button>
          </motion.div>
        )}

        {!isLoading && deckList.length > 0 && (
          <>
            {viewMode === "list" ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
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
                  <span className="text-sm font-medium">New Deck</span>
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
