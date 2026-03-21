"use client";
// Main deck editor with drag & drop zones, category drag, and grid/list toggle
import { AnimatePresence } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardListItem } from "@/components/card/CardListItem";
import { cn } from "@/components/ui/utils";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/deck/categories";
import type { CardCategory } from "@/lib/deck/types";
import { ChevronDown, ChevronRight, LayoutGrid, List, GripVertical } from "lucide-react";
import { useState } from "react";
import { useDeckStore } from "@/lib/deck/store";

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

// Draggable card list item (for intra-deck category drag)
function DraggableDeckCard({
  card,
  onRemove,
}: {
  card: DeckCard;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `deck-card-${card.id}`,
      data: { cardId: card.id, sourceCategory: card.category },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group/drag">
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-[var(--text-secondary)] opacity-0 group-hover/drag:opacity-50 hover:!opacity-100 transition-opacity shrink-0"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <div className="flex-1 min-w-0">
        <CardListItem card={card} onRemove={onRemove} />
      </div>
    </div>
  );
}

function DroppableCategory({ category, cards, onRemoveCard }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: `deck-category-${category}`,
    data: { category },
  });

  const cardIds = cards.map((c) => `deck-card-${c.id}`);

  // Always keep the droppable ref mounted so dnd-kit can detect drag-over even when empty.
  // Without this, all categories unmount when the deck is empty and `over` is always null.
  if (cards.length === 0 && !isOver) {
    return <div ref={setNodeRef} />;
  }

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

      {/* Droppable area */}
      <AnimatePresence>
        {!collapsed && (
          <div
            ref={setNodeRef}
            className={cn(
              "pl-1 min-h-[8px] rounded transition-colors",
              isOver && "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40"
            )}
          >
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
              {cards.map((card) => (
                <DraggableDeckCard
                  key={card.id}
                  card={card}
                  onRemove={onRemoveCard}
                />
              ))}
            </SortableContext>
            {cards.length === 0 && isOver && (
              <div className="py-2 text-center text-xs text-[var(--accent)]">
                Drop here to move to {label}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DeckEditor({ deck, onRemoveCard, className }: DeckEditorProps) {
  const viewMode = useDeckStore((s) => s.deckViewMode);
  const setViewMode = useDeckStore((s) => s.setDeckViewMode);

  // Group cards by category
  const cardsByCategory = deck.cards.reduce<Record<CardCategory, Deck["cards"]>>(
    (acc, card) => {
      if (!acc[card.category]) acc[card.category] = [];
      acc[card.category].push(card);
      return acc;
    },
    {} as Record<CardCategory, Deck["cards"]>
  );

  const totalCards =
    deck.cards.reduce((sum, c) => sum + c.quantity, 0) +
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

      {/* Card count header + view toggle */}
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)]">Deck Cards</p>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-xs font-medium",
              totalCards === 100
                ? "text-green-500"
                : "text-[var(--text-secondary)]"
            )}
          >
            {totalCards}/100
          </p>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded transition-colors ${
                viewMode === "list"
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="List view"
            >
              <List className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded transition-colors ${
                viewMode === "grid"
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories — uses parent DndContext from BuilderPage */}
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORY_ORDER.filter((c) => c !== "commander").map((category) => (
          <DroppableCategory
            key={category}
            category={category}
            cards={cardsByCategory[category] ?? []}
            onRemoveCard={onRemoveCard}
          />
        ))}
        {deck.cards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--text-secondary)] text-sm">
            <p>No cards yet</p>
            <p className="text-xs mt-1">
              Search and click or drag cards to add them
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
