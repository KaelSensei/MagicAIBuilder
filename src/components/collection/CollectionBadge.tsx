"use client";
// Badge showing collection ownership status on a card
import { CheckCircle } from "lucide-react";
import { useCollectionStore } from "@/lib/collection/store";
import { cn } from "@/components/ui/utils";

interface CollectionBadgeProps {
  scryfallId: string;
  className?: string;
  compact?: boolean;
}

export function CollectionBadge({ scryfallId, className, compact = false }: CollectionBadgeProps) {
  const getTotalOwned = useCollectionStore((s) => s.getTotalOwned);
  const total = getTotalOwned(scryfallId);

  if (total === 0) return null;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-[10px] font-medium text-green-400 bg-green-400/10 border border-green-400/30 rounded px-1 py-0.5",
          className
        )}
        title={`You own ${total} cop${total === 1 ? "y" : "ies"}`}
      >
        <CheckCircle className="w-2.5 h-2.5" />
        {total}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-2 py-0.5",
        className
      )}
    >
      <CheckCircle className="w-3 h-3" />
      In Collection ×{total}
    </span>
  );
}
