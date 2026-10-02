"use client";
/**
 * CollectionStatsPanel — shows owned/missing status in the deck stats sidebar.
 * Requires auth. Falls back to "sign in" message for anon users.
 */
import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Package,
  ShoppingCart,
  Check,
  CheckCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { useCollectionStore } from "@/lib/collection/store";
import {
  getMissingCollectionCards,
  summarizeDeckCollection,
} from "@/lib/collection/shopping-list";
import { ShoppingListModal } from "./ShoppingListModal";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { Link } from "@/i18n/navigation";

interface CollectionStatsPanelProps {
  readonly deck: Deck;
  readonly className?: string;
}

export function CollectionStatsPanel({
  deck,
  className,
}: CollectionStatsPanelProps) {
  const { data: session } = useSession();
  const format = useFormatter();
  const t = useTranslations("collection");
  const [expanded, setExpanded] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const collectionCards = useCollectionStore((s) => s.collectionCards);
  const collectionCardsFoil = useCollectionStore((s) => s.collectionCardsFoil);
  const bulkAddToCollection = useCollectionStore((s) => s.bulkAddToCollection);
  const isSyncing = useCollectionStore((s) => s.isSyncing);

  const collectionQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    for (const [scryfallId, card] of Object.entries(collectionCards)) {
      quantities[scryfallId] = card.quantity;
    }
    for (const [scryfallId, card] of Object.entries(collectionCardsFoil)) {
      quantities[scryfallId] = (quantities[scryfallId] ?? 0) + card.quantity;
    }
    return quantities;
  }, [collectionCards, collectionCardsFoil]);

  const quantitySummary = useMemo(
    () => summarizeDeckCollection(deck.cards, deck.commander, deck.partner, collectionQuantities),
    [deck.cards, deck.commander, deck.partner, collectionQuantities]
  );
  const pct = Math.round(quantitySummary.completionRatio * 100);

  /** Gather non-basic deck cards with only the quantity still missing. */
  const getMissingCards = useCallback((): DeckCard[] => {
    return getMissingCollectionCards(deck.cards, deck.commander, deck.partner, collectionQuantities);
  }, [deck, collectionQuantities]);

  /** Mark all deck cards as owned */
  const handleMarkAllOwned = useCallback(async () => {
    const missing = getMissingCards();
    if (missing.length === 0) return;
    const inputs = missing.map((c) => ({
      scryfallId: c.scryfallId ?? c.id,
      name: c.name,
      quantity: c.quantity,
      price: c.price,
      imageUri: c.imageUri,
    }));
    await bulkAddToCollection(inputs);
  }, [getMissingCards, bulkAddToCollection]);

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
          ownedQuantities={collectionQuantities}
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
          <Package className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
          <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">
            Collection
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            {quantitySummary.ownedQuantity}/{quantitySummary.totalQuantity}
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
                      {quantitySummary.ownedQuantity} owned · {quantitySummary.proxyQuantity} proxy · {quantitySummary.missingQuantity} missing
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
                {quantitySummary.missingQuantity > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      Missing cards cost
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      ~{format.number(quantitySummary.missingCost, {
                        style: "currency",
                        currency: "USD",
                      })}
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
                {quantitySummary.missingQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowShoppingList(true)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-[var(--accent)]/50 text-[var(--accent-text)] text-xs font-medium hover:bg-[var(--accent)]/10 transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Shopping List ({quantitySummary.missingQuantity} cards)
                  </button>
                )}

                {/* Ownership is global; edit it only from the collection page. */}
                <div className="flex gap-2">
                  {quantitySummary.missingQuantity > 0 && (
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
                  <Link
                    href="/collection"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    {t("actions.manage")}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
