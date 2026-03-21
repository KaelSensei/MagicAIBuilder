"use client";
// Compact list view for deck cards
import { motion } from "framer-motion";
import { X, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { DeckCard } from "@/lib/deck/types";
import { CardTooltip } from "@/components/card/CardTooltip";

interface CardListItemProps {
  card: DeckCard;
  onRemove?: (id: string) => void;
  className?: string;
}

export function CardListItem({ card, onRemove, className }: CardListItemProps) {
  return (
    <CardTooltip card={card}>
      <motion.div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] group transition-colors",
          className
        )}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
      >
        {/* Quantity */}
        <span className="text-xs text-[var(--text-secondary)] w-4 text-center shrink-0">
          {card.quantity}
        </span>

        {/* Card name */}
        <span className="flex-1 text-sm truncate text-[var(--text-primary)]">
          {card.name}
        </span>

        {/* Mana cost */}
        <span className="text-xs text-[var(--text-secondary)] shrink-0">
          {card.cmc > 0 ? card.cmc : "—"}
        </span>

        {/* Flags */}
        {card.isGameChanger && (
          <span title="Game Changer"><Zap className="w-3 h-3 text-amber-400" /></span>
        )}
        {card.isBanned && (
          <span title="Banned"><AlertTriangle className="w-3 h-3 text-red-500" /></span>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={() => onRemove(card.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400"
            aria-label={`Remove ${card.name}`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    </CardTooltip>
  );
}
