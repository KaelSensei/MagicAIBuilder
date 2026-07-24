"use client";
/**
 * CollectionStatsPanel — shows owned/missing status in the deck stats sidebar.
 * Requires auth. Falls back to "sign in" message for anon users.
 */
import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  ShoppingCart,
  Check,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { useCollectionStore } from "@/lib/collection/store";
import { computeCollectionStats } from "@/lib/collection/shopping-list";
import { ShoppingListModal } from "./ShoppingListModal";
import type { Deck, DeckCard } from "@/lib/deck/types";

interface CollectionStatsPanelProps {
  readonly deck: Deck;
  readonly className?: string;
}

export function CollectionStatsPanel({
  deck,
  className,
}: CollectionStatsPanelProps) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const collectionCards = useCollectionStore((s) => s.collectionCards);
  const collectionCardsFoil = useCollectionStore((s) => s.collectionCardsFoil);
  const bulkAddToCollection = useCollectionStore((s) => s.bulkAddToCollection);
  const removeFromCollection = useCollectionStore(
    (s) => s.removeFromCollection
  );
  const isSyncing = useCollectionStore((s) => s.isSyncing);

  const ownedScryfallIds = useMemo(() => {
    const ids = new Set<string>();
    for (const scryfallId of Object.keys(collectionCards)) ids.add(scryfallId);
    for (const scryfallId of Object.keys(collectionCardsFoil))
      ids.add(scryfallId);
    return ids;
  }, [collectionCards, collectionCardsFoil]);

  const stats = useMemo(
    () =>
      computeCollectionStats(
        deck.cards,
        deck.commander,
        deck.partner,
        ownedScryfallIds
      ),
    [deck.cards, deck.commander, deck.partner, ownedScryfallIds]
  );

  const pct = Math.round(stats.completionRatio * 100);

  /** Gather all unique non-basic deck cards not yet in collection */
  const getMissingCards = useCallback((): DeckCard[] => {
    const allCards: DeckCard[] = [];
    if (deck.commander) allCards.push(deck.commander);
    if (deck.partner) allCards.push(deck.partner);
    for (const c of deck.cards) {
      if (c.zone === "main") allCards.push(c);
    }
    return allCards.filter(
      (c) =>
        !c.typeLine.toLowerCase().includes("basic land") &&
        !ownedScryfallIds.has(c.scryfallId ?? c.id)
    );
  }, [deck, ownedScryfallIds]);

  /** Mark all deck cards as owned */
  const handleMarkAllOwned = useCallback(async () => {
    const missing = getMissingCards();
    if (missing.length === 0) return;
    const inputs = missing.map((c) => ({
      scryfallId: c.scryfallId ?? c.id,
      name: c.name,
      quantity: 1,
      price: c.price,
      imageUri: c.imageUri,
    }));
    await bulkAddToCollection(inputs);
  }, [getMissingCards, bulkAddToCollection]);

  /** Remove all deck cards from collection */
  const handleResetCollection = useCallback(async () => {
    const allCards: DeckCard[] = [];
    if (deck.commander) allCards.push(deck.commander);
    if (deck.partner) allCards.push(deck.partner);
    for (const c of deck.cards) {
      if (c.zone === "main") allCards.push(c);
    }
    for (const card of allCards) {
      const sid = card.scryfallId ?? card.id;
      const normal = collectionCards[sid];
      const foil = collectionCardsFoil[sid];
      if (normal) await removeFromCollection(normal.id);
      if (foil) await removeFromCollection(foil.id);
    }
  }, [deck, collectionCards, collectionCardsFoil, removeFromCollection]);

  if (!session?.user) {
    return (
      <div
        className={cn(
          "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--text-secondary)]",
          className
        )}
      >
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

      <div
        className={cn(
          "rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden",
          className
        )}
      >
        <button
          type="button"
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
                    <span
                      className={cn(
                        "font-medium",
                        pct === 100
                          ? "text-green-400"
                          : "text-[var(--text-primary)]"
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        pct === 100 ? "bg-green-500" : "bg-[var(--accent)]"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Missing cost */}
                {stats.missingCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      Missing cards cost
                    </span>
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
                    type="button"
                    onClick={() => setShowShoppingList(true)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-[var(--accent)]/50 text-[var(--accent)] text-xs font-medium hover:bg-[var(--accent)]/10 transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Shopping List ({stats.missingCount} cards)
                  </button>
                )}

                {/* Mark all + Reset */}
                <div className="flex gap-2">
                  {stats.missingCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllOwned}
                      disabled={isSyncing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-green-500/50 text-green-400 text-xs font-medium hover:bg-green-500/10 transition-colors disabled:opacity-50"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all owned
                    </button>
                  )}
                  {stats.ownedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetCollection}
                      disabled={isSyncing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
