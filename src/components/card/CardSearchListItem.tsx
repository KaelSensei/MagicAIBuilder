"use client";
// List view row for search results
import { motion } from "framer-motion";
import { Plus, Bookmark } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { DraggableCard } from "./DraggableCard";

interface CardSearchListItemProps {
  card: ScryfallCard;
  onClick?: (card: ScryfallCard) => void;
  onAddToMaybeboard?: (card: ScryfallCard) => void;
  isInMaybeboard?: boolean;
  draggable?: boolean;
  className?: string;
}

function ListItemContent({
  card,
  onClick,
  onAddToMaybeboard,
  isInMaybeboard,
}: {
  card: ScryfallCard;
  onClick?: (card: ScryfallCard) => void;
  onAddToMaybeboard?: (card: ScryfallCard) => void;
  isInMaybeboard?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--surface-hover)] group transition-colors cursor-pointer"
      )}
      onClick={() => onClick?.(card)}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className="flex-1 text-sm truncate text-[var(--text-primary)]">
        {card.name}
      </span>

      {/* In Maybeboard badge */}
      {isInMaybeboard && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
          In Maybeboard
        </span>
      )}

      <span className="text-xs text-[var(--text-secondary)] shrink-0">
        {card.cmc > 0 ? card.cmc : "—"}
      </span>

      {/* Add to deck */}
      <Plus className="w-3.5 h-3.5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />

      {/* Add to maybeboard */}
      {onAddToMaybeboard && !isInMaybeboard && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToMaybeboard(card);
          }}
          className="opacity-0 group-hover:opacity-70 hover:!opacity-100 shrink-0 transition-opacity text-amber-400"
          title="Add to Maybeboard"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

export function CardSearchListItem({
  card,
  onClick,
  onAddToMaybeboard,
  isInMaybeboard = false,
  draggable = false,
  className,
}: CardSearchListItemProps) {
  if (draggable) {
    return (
      <div className={className}>
        <DraggableCard card={card}>
          <ListItemContent
            card={card}
            onClick={onClick}
            onAddToMaybeboard={onAddToMaybeboard}
            isInMaybeboard={isInMaybeboard}
          />
        </DraggableCard>
      </div>
    );
  }
  return (
    <div className={className}>
      <ListItemContent
        card={card}
        onClick={onClick}
        onAddToMaybeboard={onAddToMaybeboard}
        isInMaybeboard={isInMaybeboard}
      />
    </div>
  );
}
