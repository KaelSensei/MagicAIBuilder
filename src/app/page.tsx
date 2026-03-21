"use client";
// Home page — deck list (loaded from DB)
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/deck/store";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Plus, Layers, Clock, Loader2, Trash2, Copy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Deck } from "@/lib/deck/types";
import { DeckWizard } from "@/components/deck/DeckWizard";

interface DeckCardItemProps {
  readonly deck: Deck;
  readonly onDelete: (e: React.MouseEvent, id: string) => void;
  readonly onDuplicate: (e: React.MouseEvent, id: string) => void;
  readonly deletingId: string | null;
  readonly duplicatingId: string | null;
}

/** Colors per bracket level — consistent with BracketIndicator.tsx */
const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 bg-green-500/15 border-green-500/30",
  2: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  3: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  4: "text-red-400 bg-red-500/15 border-red-500/30",
};

function DeckCardItem({ deck, onDelete, onDuplicate, deletingId, duplicatingId }: DeckCardItemProps) {
  const hasArt = Boolean(deck.commander?.artCropUri);
  const textMuted = hasArt ? "text-white/70" : "text-[var(--text-secondary)]";
  const textPrimary = hasArt ? "text-white" : "text-[var(--text-primary)]";

  // Resolve displayed bracket: manual overrides auto-calculated target
  const bracket = deck.manualBracket ?? deck.targetBracket;
  const isManual = Boolean(deck.manualBracket);

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
          <div className="flex items-center gap-1.5 shrink-0">
            {deck.isAIGenerated && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                ✨ AI
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${hasArt ? "bg-black/40 text-white/70" : "bg-[var(--border)] text-[var(--text-secondary)]"}`}>
              {deck.format}
            </span>
          </div>
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
          {/* Bracket badge — manual overrides show a gear icon */}
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded border ${BRACKET_COLORS[bracket]}`}
            title={isManual ? "Manual bracket override" : "Auto bracket"}
          >
            B{bracket}{isManual ? " ⚙" : ""}
          </span>
          <div className="flex items-center gap-1">
            {/* Duplicate button */}
            <button
              onClick={(e) => onDuplicate(e, deck.id)}
              disabled={duplicatingId === deck.id}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--accent)]/20 text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-60"
              aria-label={`Duplicate ${deck.name}`}
            >
              {duplicatingId === deck.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {/* Delete button */}
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

const TAG_COLORS: Record<string, string> = {
  casual: "bg-green-500/20 text-green-400 border-green-500/30",
  cEDH: "bg-red-500/20 text-red-400 border-red-500/30",
  WIP: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  budget: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tuned: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  theme: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};
const DEFAULT_TAG_COLOR = "bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)]";
const tagColor = (tag: string) => TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;

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
  const { decks, createDeck, loadDecks, isSyncing, deleteDeck, duplicateDeck } = useDeckStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const deckList = Object.values(decks);

  // Load decks from DB on mount
  useEffect(() => {
    loadDecks().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on mount; loadDecks is stable
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

  const handleDuplicateDeck = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDuplicatingId(id);
    try {
      const newId = await duplicateDeck(id);
      router.push(`/builder/${newId}`);
    } catch (err) {
      console.error("[handleDuplicateDeck]", err);
      setDuplicatingId(null);
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
          <div className="flex items-center gap-2">
            {/* AI wizard button */}
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Build with AI
            </button>
            {/* Manual new deck */}
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
                <DeckCardItem deck={deck} onDelete={handleDeleteDeck} onDuplicate={handleDuplicateDeck} deletingId={deletingId} duplicatingId={duplicatingId} />
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

      {/* AI Deck Builder Wizard */}
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
