"use client";
// Home page — deck list
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/lib/deck/store";
import { Header } from "@/components/layout/Header";
import { Plus, Layers, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { decks, createDeck } = useDeckStore();
  const deckList = Object.values(decks);

  const handleNewDeck = () => {
    const name = `New Deck ${deckList.length + 1}`;
    const id = createDeck(name);
    router.push(`/builder/${id}`);
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
              {deckList.length === 0
                ? "No decks yet — create your first deck!"
                : `${deckList.length} deck${deckList.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={handleNewDeck}
            className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Deck
          </button>
        </div>

        {deckList.length === 0 ? (
          /* Empty state */
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
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Deck
            </button>
          </motion.div>
        ) : (
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
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Link
                  href={`/builder/${deck.id}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] transition-all p-5"
                  data-testid="deck-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate pr-2">
                      {deck.name}
                    </h3>
                    <span className="text-xs bg-[var(--border)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full shrink-0">
                      {deck.format}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {deck.commander
                      ? `Commander: ${deck.commander.name}`
                      : "No commander yet"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {deck.cards.length + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0)}{" "}
                    / 100 cards
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-[var(--text-secondary)]">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(deck.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* New deck button card */}
            <motion.button
              onClick={handleNewDeck}
              className="rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-transparent hover:bg-[var(--surface)] transition-all p-5 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] h-40"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-medium">New Deck</span>
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
