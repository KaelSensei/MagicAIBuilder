"use client";
// Main deck editor with drag & drop zones
import { AnimatePresence } from "framer-motion";
import { CardListItem } from "@/components/card/CardListItem";
import { cn } from "@/components/ui/utils";
import type { Deck } from "@/lib/deck/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/deck/categories";
import type { CardCategory } from "@/lib/deck/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface DeckEditorProps {
  deck: Deck;
  onRemoveCard: (id: string) => void;
  className?: string;
}

interface CategorySectionProps {
  category: CardCategory;
  cards: Deck["cards"];
  onRemoveCard: (id: string) => void;
}

function CategorySection({ category, cards, onRemoveCard }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (cards.length === 0) return null;

  const label = CATEGORY_LABELS[category];

  return (
    <div className="mb-2">
      {/* Category header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors group"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        )}
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs text-[var(--text-secondary)] ml-auto">
          {cards.reduce((sum, c) => sum + c.quantity, 0)}
        </span>
      </button>

      {/* Cards */}
      <AnimatePresence>
        {!collapsed && (
          <div className="pl-2">
            {cards.map((card) => (
              <CardListItem
                key={card.id}
                card={card}
                onRemove={onRemoveCard}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DeckEditor({ deck, onRemoveCard, className }: DeckEditorProps) {
  // Group cards by category
  const cardsByCategory = deck.cards.reduce<Record<CardCategory, Deck["cards"]>>(
    (acc, card) => {
      if (!acc[card.category]) acc[card.category] = [];
      acc[card.category].push(card);
      return acc;
    },
    {} as Record<CardCategory, Deck["cards"]>
  );

  const totalCards = deck.cards.reduce((sum, c) => sum + c.quantity, 0) +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Commander zone */}
      <div className="p-3 border-b border-[var(--border)]">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Commander
        </p>
        {deck.commander ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-primary)] font-medium">
              {deck.commander.name}
            </span>
            {deck.partner && (
              <>
                <span className="text-[var(--text-secondary)]">&amp;</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {deck.partner.name}
                </span>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-secondary)] italic">
            Search for a commander above
          </p>
        )}
      </div>

      {/* Card count header */}
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)]">Deck Cards</p>
        <p
          className={cn(
            "text-xs font-medium",
            totalCards === 100 ? "text-green-500" : "text-[var(--text-secondary)]"
          )}
        >
          {totalCards}/100
        </p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORY_ORDER.filter((c) => c !== "commander").map((category) => (
          <CategorySection
            key={category}
            category={category}
            cards={cardsByCategory[category] ?? []}
            onRemoveCard={onRemoveCard}
          />
        ))}
        {deck.cards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--text-secondary)] text-sm">
            <p>No cards yet</p>
            <p className="text-xs mt-1">Search and click cards to add them</p>
          </div>
        )}
      </div>
    </div>
  );
}
