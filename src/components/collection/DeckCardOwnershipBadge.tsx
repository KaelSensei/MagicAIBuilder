"use client";
// Badge for deck cards showing Owned / Need to buy status
import { Package, ShoppingCart } from "lucide-react";
import { useCollectionStore } from "@/lib/collection/store";
import { cn } from "@/components/ui/utils";

interface DeckCardOwnershipBadgeProps {
  readonly scryfallId: string;
  readonly className?: string;
}

export function DeckCardOwnershipBadge({ scryfallId, className }: DeckCardOwnershipBadgeProps) {
  const getTotalOwned = useCollectionStore((s) => s.getTotalOwned);
  const total = getTotalOwned(scryfallId);

  if (total > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 rounded px-1 py-0.5",
          className
        )}
        title={`Owned (×${total})`}
      >
        <Package className="w-2.5 h-2.5" />
        Owned
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-400 bg-amber-400/10 rounded px-1 py-0.5",
        className
      )}
      title="Not in your collection — need to buy"
    >
      <ShoppingCart className="w-2.5 h-2.5" />
      Buy
    </span>
  );
}
