"use client";
/**
 * CollectionStatsPanel — shows owned/missing status in the deck stats sidebar.
 * Requires auth. Falls back to "sign in" message for anon users.
 */
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Package, ShoppingCart, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { useCollectionStore } from "@/lib/collection/store";
import { computeCollectionStats } from "@/lib/collection/shopping-list";
import { ShoppingListModal } from "./ShoppingListModal";
import type { Deck } from "@/lib/deck/types";

interface CollectionStatsPanelProps {
  readonly deck: Deck;
  readonly className?: string;
}

export function CollectionStatsPanel({ deck, className }: CollectionStatsPanelProps) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const collectionCards = useCollectionStore((s) => s.collectionCards);
  const collectionCardsFoil = useCollectionStore((s) => s.collectionCardsFoil);

  const ownedScryfallIds = useMemo(() => {
    const ids = new Set<string>();
    for (const scryfallId of Object.keys(collectionCards)) ids.add(scryfallId);
    for (const scryfallId of Object.keys(collectionCardsFoil)) ids.add(scryfallId);
    return ids;
  }, [collectionCards, collectionCardsFoil]);

  const stats = useMemo(
    () => computeCollectionStats(deck.cards, deck.commander, deck.partner, ownedScryfallIds),
    [deck.cards, deck.commander, deck.partner, ownedScryfallIds]
  );

  const pct = Math.round(stats.completionRatio * 100);

  if (!session?.user) {
    return (
      <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--text-secondary)]", className)}>
        <Package className="w-3.5 h-3.5 inline mr-1.5" />
        Sign in to track your collection
      </div>
    );
  }

  return (
    <>
      {showShoppingList && (
        <ShoppingListModal
          deck={deck}
          ownedScryfallIds={ownedScryfallIds}
          onClose={() => setShowShoppingList(false)}
        />
      )}

      <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden", className)}>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
        >
          <Package className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">
            Collection
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            {stats.ownedCount}/{stats.totalCount}
          </span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-3">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      {stats.ownedCount} owned · {stats.missingCount} missing
                    </span>
                    <span className={cn("font-medium", pct === 100 ? "text-green-400" : "text-[var(--text-primary)]")}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-green-500" : "bg-[var(--accent)]")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Missing cost */}
                {stats.missingCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Missing cards cost</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      ~${stats.missingCost.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Complete badge */}
                {pct === 100 && (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs">
                    <Check className="w-3.5 h-3.5" />
                    Deck complete — you own all cards!
                  </div>
                )}

                {/* Shopping list button */}
                {stats.missingCount > 0 && (
                  <button
                    onClick={() => setShowShoppingList(true)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-[var(--accent)]/50 text-[var(--accent)] text-xs font-medium hover:bg-[var(--accent)]/10 transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Shopping List ({stats.missingCount} cards)
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
