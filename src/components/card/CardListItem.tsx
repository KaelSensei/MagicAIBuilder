"use client";
// Compact list view for deck cards
import { motion } from "framer-motion";
import { X, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { DeckCard } from "@/lib/deck/types";
import { CardTooltip } from "@/components/card/CardTooltip";
import { CardNoteInline } from "@/components/card/CardNoteInline";

interface CardListItemProps {
  card: DeckCard;
  onRemove?: (id: string) => void;
  className?: string;
  /** Show note icon (only for deck list view, not search results) */
  showNotes?: boolean;
}

export function CardListItem({ card, onRemove, className, showNotes = false }: CardListItemProps) {
  return (
    <CardTooltip card={card}>
      <motion.div
        className={cn(
          "relative flex flex-col gap-0 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] group transition-colors",
          className
        )}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
      >
        {/* Main row */}
        <div className="flex items-center gap-2">
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

          {/* Note icon */}
          {showNotes && (
            <CardNoteInline cardId={card.id} notes={card.notes} />
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
        </div>

        {/* Note preview — shown when note exists and popover not open */}
        {showNotes && card.notes?.trim() && (
          <p className="text-[10px] text-amber-400/70 pl-6 truncate">
            {card.notes.trim()}
          </p>
        )}
      </motion.div>
    </CardTooltip>
  );
}
