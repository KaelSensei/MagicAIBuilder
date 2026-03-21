"use client";
// Home page — deck list (loaded from DB)
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/deck/store";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Plus, Layers, Clock, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Deck } from "@/lib/deck/types";

interface DeckCardItemProps {
  deck: Deck;
  onDelete: (e: React.MouseEvent, id: string) => void;
  deletingId: string | null;
}

function DeckCardItem({ deck, onDelete, deletingId }: DeckCardItemProps) {
  const hasArt = Boolean(deck.commander?.artCropUri);
  const textMuted = hasArt ? "text-white/70" : "text-[var(--text-secondary)]";
  const textPrimary = hasArt ? "text-white" : "text-[var(--text-primary)]";

  return (
    <Link
      href={`/builder/${deck.id}`}
      className="block rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-all overflow-hidden group relative"
      style={hasArt ? { backgroundImage: `url(${deck.commander?.artCropUri})`, backgroundSize: "cover", backgroundPosition: "center top" } : undefined}
      data-testid="deck-card"
    >
      <div className={`p-5 h-full ${hasArt ? "bg-gradient-to-t from-black/90 via-black/60 to-black/20" : "bg-[var(--surface)] group-hover:bg-[var(--surface-hover)]"}`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-semibold truncate pr-2 ${textPrimary}`}>{deck.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${hasArt ? "bg-black/40 text-white/70" : "bg-[var(--border)] text-[var(--text-secondary)]"}`}>
            {deck.format}
          </span>
        </div>
        <p className={`text-sm ${textMuted}`}>
          {deck.commander ? `Commander: ${deck.commander.name}` : "No commander yet"}
        </p>
        <p className={`text-xs mt-1 ${textMuted}`}>
          {deck.cards.length + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0)} / 100 cards
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className={`flex items-center gap-1 text-xs ${textMuted}`}>
            <Clock className="w-3 h-3" />
            <span>{new Date(deck.updatedAt).toLocaleDateString()}</span>
          </div>
          <button
            onClick={(e) => onDelete(e, deck.id)}
            disabled={deletingId === deck.id}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 disabled:opacity-60"
            aria-label={`Delete ${deck.name}`}
          >
            {deletingId === deck.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

function getDeckSubtitle(isLoading: boolean, count: number): string {
  if (isLoading) return "Loading…";
  if (count === 0) return "No decks yet — create your first deck!";
  return `${count} deck${count > 1 ? "s" : ""}`;
}

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

function DeckCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-[var(--border)] rounded w-2/3" />
        <div className="h-4 bg-[var(--border)] rounded w-16 ml-2" />
      </div>
      <div className="h-3 bg-[var(--border)] rounded w-1/2 mt-2" />
      <div className="h-3 bg-[var(--border)] rounded w-1/3 mt-2" />
      <div className="h-3 bg-[var(--border)] rounded w-1/4 mt-3" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { decks, createDeck, loadDecks, isSyncing, deleteDeck } = useDeckStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const deckList = Object.values(decks);

  // Load decks from DB on mount
  useEffect(() => {
    loadDecks().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteDeck = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    if (!confirm("Delete this deck? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteDeck(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewDeck = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const name = `New Deck ${deckList.length + 1}`;
      const id = await createDeck(name);
      router.push(`/builder/${id}`);
    } catch (err) {
      console.error("[handleNewDeck]", err);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              My Decks
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {getDeckSubtitle(isLoading, deckList.length)}
            </p>
          </div>
          <button
            onClick={handleNewDeck}
            disabled={isCreating || isSyncing}
            className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Deck
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKELETON_KEYS.map((key) => <DeckCardSkeleton key={key} />)}
          </div>
        )}
        {!isLoading && deckList.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Layers className="w-12 h-12 text-[var(--accent)] mb-4 opacity-60" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Start building
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
              Create your first Commander deck with live bracket scoring and
              Game Changers detection.
            </p>
            <button
              onClick={handleNewDeck}
              disabled={isCreating}
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Deck
            </button>
          </motion.div>
        )}
        {!isLoading && deckList.length > 0 && (
          /* Deck grid */
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {deckList.map((deck) => (
              <motion.div
                key={deck.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              >
                <DeckCardItem deck={deck} onDelete={handleDeleteDeck} deletingId={deletingId} />
              </motion.div>
            ))}

            {/* New deck button card */}
            <motion.button
              onClick={handleNewDeck}
              disabled={isCreating}
              className="rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-transparent hover:bg-[var(--surface)] transition-all p-5 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] h-40 disabled:opacity-60 disabled:cursor-not-allowed"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              {isCreating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
              <span className="text-sm font-medium">New Deck</span>
            </motion.button>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
