"use client";
// Maybeboard panel — cards being considered but not yet in the deck
import { ArrowRight, Trash2 } from "lucide-react";
import { CardTooltip } from "@/components/card/CardTooltip";
import { cn } from "@/components/ui/utils";
import type { DeckCard } from "@/lib/deck/types";

interface MaybeboardPanelProps {
  cards: DeckCard[];
  onMoveToDecks: (cardId: string) => void;
  onRemove: (cardId: string) => void;
  className?: string;
}

export function MaybeboardPanel({
  cards,
  onMoveToDecks,
  onRemove,
  className,
}: MaybeboardPanelProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
            Maybeboard
          </p>
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-hover)] px-1.5 py-0.5 rounded-full">
            {cards.reduce((sum, c) => sum + c.quantity, 0)}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] italic opacity-60">
          Not counted in the 99
        </p>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto">
        {cards.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[var(--text-secondary)] text-xs italic">
            No cards in maybeboard
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] group transition-colors"
              >
                {/* Card name */}
                <CardTooltip card={card}>
                  <span className="flex-1 text-sm truncate text-[var(--text-primary)] cursor-default">
                    {card.name}
                  </span>
                </CardTooltip>

                {/* Maybeboard badge */}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 hidden group-hover:hidden sm:block">
                  Maybeboard
                </span>

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onMoveToDecks(card.id)}
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                    title="Move to deck"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>Deck</span>
                  </button>
                  <button
                    onClick={() => onRemove(card.id)}
                    className="p-1 rounded text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Remove from maybeboard"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
