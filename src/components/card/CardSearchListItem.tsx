"use client";
// List view row for search results
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { DraggableCard } from "./DraggableCard";

interface CardSearchListItemProps {
  card: ScryfallCard;
  onClick?: (card: ScryfallCard) => void;
  draggable?: boolean;
  className?: string;
  isSelected?: boolean;
}

function ListItemContent({
  card,
  onClick,
  isSelected,
}: {
  card: ScryfallCard;
  onClick?: (card: ScryfallCard) => void;
  isSelected?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded hover:bg-[var(--surface-hover)] group transition-colors cursor-pointer",
        isSelected && "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/40"
      )}
      onClick={() => onClick?.(card)}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Keyboard selection indicator */}
      {isSelected && (
        <span className="w-1 h-4 rounded-full bg-[var(--accent)] shrink-0" />
      )}
      <span className="flex-1 text-sm truncate text-[var(--text-primary)]">
        {card.name}
      </span>
      <span className="text-xs text-[var(--text-secondary)] shrink-0">
        {card.cmc > 0 ? card.cmc : "—"}
      </span>
      <Plus className="w-3.5 h-3.5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
    </motion.div>
  );
}

export function CardSearchListItem({
  card,
  onClick,
  draggable = false,
  className,
  isSelected = false,
}: CardSearchListItemProps) {
  if (draggable) {
    return (
      <div className={className}>
        <DraggableCard card={card}>
          <ListItemContent card={card} onClick={onClick} isSelected={isSelected} />
        </DraggableCard>
      </div>
    );
  }
  return (
    <div className={className}>
      <ListItemContent card={card} onClick={onClick} isSelected={isSelected} />
    </div>
  );
}
