"use client";
// Displays the total deck price with a missing-price warning
import { DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useDeckPrice } from "@/hooks/useDeckPrice";

interface DeckPriceDisplayProps {
  readonly className?: string;
}

/**
 * Shows the total USD value of the active deck computed by `useDeckPrice`.
 * Renders nothing when the deck has no cards yet.
 */
export function DeckPriceDisplay({ className }: DeckPriceDisplayProps) {
  const { totalPrice, missingPriceCount, hasCards } = useDeckPrice();

  if (!hasCards) return null;

  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4",
        className
      )}
    >
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
        Deck Price
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-[var(--text-secondary)]">
            Total value
          </span>
        </div>
        <span className="text-sm font-semibold text-emerald-400">
          ${totalPrice.toFixed(2)}
        </span>
      </div>

      {missingPriceCount > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[11px] text-[var(--text-secondary)]">
            {missingPriceCount} card
            {missingPriceCount > 1 ? "s" : ""} without price data
          </span>
        </div>
      )}
    </div>
  );
}
