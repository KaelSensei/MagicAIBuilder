"use client";
/**
 * The main deck zone: the commander banner row, then the 99 as a sortable
 * list or a grid, grouped by category or by whatever the toolbar selected.
 *
 * Split out of `DeckEditor` with its whole drag-and-drop chain —
 * `DraggableDeckCard`, `GenericGroup`, `DroppableCategory` and
 * `getDropZoneClass` were used by nothing else, so they travel together
 * rather than being left behind as orphans in the parent.
 *
 * @module deck/MainZoneContent
 */

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CardImage } from "@/components/card/CardImage";
import { CardListItem } from "@/components/card/CardListItem";
import { gridColsClass } from "@/components/deck/grid-cols";
import { cn } from "@/components/ui/utils";
import { isCompanionOutsideColorIdentity } from "@/lib/deck/color-identity";
import type { CardGroup } from "@/lib/deck/sort";
import type { Deck, DeckCard, CardCategory } from "@/lib/deck/types";

interface CategorySectionProps {
  readonly category: CardCategory;
  readonly cards: Deck["cards"];
  readonly onRemoveCard: (id: string) => void;
  readonly onMoveToMaybeboard?: (id: string) => void;
}

// Draggable card list item (for intra-deck category drag)
function DraggableDeckCard({
  card,
  onRemove,
  onMoveToMaybeboard: _onMoveToMaybeboard,
  isColorIdentityViolation = false,
}: {
  readonly card: DeckCard;
  readonly onRemove: (id: string) => void;
  readonly onMoveToMaybeboard?: (id: string) => void;
  readonly isColorIdentityViolation?: boolean;
}) {
  const t = useTranslations("builder");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `deck-card-${card.id}`,
    data: { cardId: card.id, sourceCategory: card.category },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center group/drag"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-[var(--text-secondary)] opacity-0 group-hover/drag:opacity-50 hover:!opacity-100 transition-opacity shrink-0"
        tabIndex={-1}
        aria-label={t("actions.dragToReorder")}
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <div className="flex-1 min-w-0">
        <CardListItem
          card={card}
          onRemove={onRemove}
          showNotes
          className={cn(
            isColorIdentityViolation &&
              "ring-1 ring-red-500/60 bg-red-500/5 opacity-80 hover:opacity-100"
          )}
        />
      </div>
    </div>
  );
}

// Generic collapsible group (for CMC/color groupings that don't map to a DnD category)
function GenericGroup({
  label,
  cards,
  onRemoveCard,
  onMoveToMaybeboard,
  violationCardIds,
}: {
  readonly label: string;
  readonly cards: Deck["cards"];
  readonly onRemoveCard: (id: string) => void;
  readonly onMoveToMaybeboard?: (id: string) => void;
  readonly violationCardIds: ReadonlySet<string>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--surface-hover)] transition-colors group"
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
      {!collapsed && (
        <div className="pl-1">
          {cards.map((card) => (
            <DraggableDeckCard
              key={card.id}
              card={card}
              onRemove={onRemoveCard}
              onMoveToMaybeboard={onMoveToMaybeboard}
              isColorIdentityViolation={violationCardIds.has(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getDropZoneClass(isOver: boolean, isEmpty: boolean): string {
  if (isOver) return "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40";
  if (isEmpty)
    return "min-h-[32px] border border-dashed border-[var(--border)] rounded opacity-40";
  return "min-h-[8px]";
}


function DroppableCategory({
  category,
  cards,
  onRemoveCard,
  onMoveToMaybeboard,
  violationCardIds,
}: CategorySectionProps & { readonly violationCardIds: ReadonlySet<string> }) {
  const t = useTranslations("builder");
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: `deck-category-${category}`,
    data: { category },
  });

  const cardIds = cards.map((c) => `deck-card-${c.id}`);
  const label = t(`categories.${category}`);

  return (
    <div className="mb-2">
      {/* Category header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--surface-hover)] transition-colors group"
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

      {/* Droppable area — always rendered so drag targets exist even when empty */}
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            "pl-1 rounded transition-colors",
            getDropZoneClass(isOver, cards.length === 0)
          )}
        >
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => (
              <DraggableDeckCard
                key={card.id}
                card={card}
                onRemove={onRemoveCard}
                onMoveToMaybeboard={onMoveToMaybeboard}
                isColorIdentityViolation={violationCardIds.has(card.id)}
              />
            ))}
          </SortableContext>
          {cards.length === 0 && isOver && (
            <div className="py-2 text-center text-xs text-[var(--accent)]">
              {t("dropToMove", { label })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Grid class helper ────────────────────────────────────────────────────────

// ─── Main zone sub-component ──────────────────────────────────────────────────

export interface MainZoneContentProps {
  readonly deck: Deck;
  readonly mainCards: Deck["cards"];
  readonly viewMode: "grid" | "list";
  readonly gridCols: number;
  readonly cardGroups: CardGroup[];
  readonly violationCardIds: ReadonlySet<string>;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly clearCommander: () => void;
  readonly setPartner: (p: null) => void;
  readonly clearCompanion: () => void;
  readonly onMoveToMaybeboard?: (id: string) => void;
}

export function MainZoneContent({
  deck,
  mainCards,
  viewMode,
  gridCols,
  cardGroups,
  violationCardIds,
  onRemoveCard,
  onCardClick,
  clearCommander,
  setPartner,
  clearCompanion,
  onMoveToMaybeboard,
}: MainZoneContentProps) {
  const t = useTranslations("builder");
  if (viewMode === "grid") {
    return (
      <div className={gridColsClass(gridCols)}>
        {deck.commander && (
          <div className="relative group/card">
            <CardImage
              imageUri={deck.commander.imageUri}
              largeUri={deck.commander.imageUri}
              name={deck.commander.name}
              manaCost={deck.commander.manaCost}
              cmc={deck.commander.cmc}
              showOverlay={!deck.commander.cardFaces}
              zoomOnHover={false}
              className="w-full ring-2 ring-yellow-400/70 rounded-[4%] cursor-pointer"
              onClick={() => onCardClick?.(deck.commander!)}
              cardFaces={deck.commander.cardFaces}
              isFlexibleLand={deck.commander.isFlexibleLand}
            />
            <div className="absolute bottom-1 left-1 bg-yellow-400/90 text-black text-[9px] font-bold px-1 rounded leading-tight">
              {t("badges.cmd")}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearCommander();
              }}
              className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10"
              title={t("actions.removeCommander")}
            >
              ×
            </button>
          </div>
        )}
        {deck.partner && deck.partner.name !== deck.commander?.name && (
          <div className="relative group/card">
            <CardImage
              imageUri={deck.partner.imageUri}
              largeUri={deck.partner.imageUri}
              name={deck.partner.name}
              manaCost={deck.partner.manaCost}
              cmc={deck.partner.cmc}
              showOverlay={!deck.partner.cardFaces}
              zoomOnHover={false}
              className="w-full ring-2 ring-yellow-400/70 rounded-[4%] cursor-pointer"
              onClick={() => onCardClick?.(deck.partner!)}
              cardFaces={deck.partner.cardFaces}
              isFlexibleLand={deck.partner.isFlexibleLand}
            />
            <div className="absolute bottom-1 left-1 bg-yellow-400/90 text-black text-[9px] font-bold px-1 rounded leading-tight">
              {t("badges.cmd")}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPartner(null);
              }}
              className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10"
              title={t("actions.removePartner")}
            >
              ×
            </button>
          </div>
        )}
        {deck.companion &&
          (() => {
            const companionViolation = isCompanionOutsideColorIdentity(deck);
            return (
              <div className="relative group/card">
                <CardImage
                  imageUri={deck.companion.imageUri}
                  largeUri={deck.companion.imageUri}
                  name={deck.companion.name}
                  manaCost={deck.companion.manaCost}
                  cmc={deck.companion.cmc}
                  showOverlay={!deck.companion.cardFaces}
                  zoomOnHover={false}
                  className={`w-full ring-2 rounded-[4%] cursor-pointer ${companionViolation ? "ring-red-500/70 opacity-70 hover:opacity-100" : "ring-teal-400/75"}`}
                  onClick={() => onCardClick?.(deck.companion!)}
                  cardFaces={deck.companion.cardFaces}
                  isFlexibleLand={deck.companion.isFlexibleLand}
                />
                <div
                  className={`absolute bottom-1 left-1 text-black text-[8px] font-bold px-1 rounded leading-tight ${companionViolation ? "bg-red-500/90" : "bg-teal-500/90"}`}
                >
                  {t("badges.comp")}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCompanion();
                  }}
                  className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10"
                  title={t("actions.removeCompanion")}
                >
                  ×
                </button>
              </div>
            );
          })()}
        {mainCards.map((card) => (
          <div key={card.id} className="relative group/card">
            <CardImage
              imageUri={card.imageUri}
              largeUri={card.imageUri}
              name={card.name}
              manaCost={card.manaCost}
              cmc={card.cmc}
              showOverlay={!card.cardFaces}
              zoomOnHover={false}
              className={cn(
                "w-full cursor-pointer transition-opacity",
                violationCardIds.has(card.id) &&
                  "ring-2 ring-red-500/70 opacity-70 hover:opacity-100"
              )}
              onClick={() => onCardClick?.(card)}
              cardFaces={card.cardFaces}
              isFlexibleLand={card.isFlexibleLand}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCard(card.id);
              }}
              className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10"
              aria-label={t("actions.removeCard", { name: card.name })}
            >
              ×
            </button>
          </div>
        ))}
        {!deck.commander && mainCards.length === 0 && (
          <div className="col-span-4 flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm">
            {t("noCardsYet")}
          </div>
        )}
      </div>
    );
  }

  // List view: render sorted + grouped sections
  return (
    <>
      {cardGroups.map((group) => {
        // Use DroppableCategory (with DnD support) only when grouping by type
        // and the group key matches a valid CardCategory
        const isCategoryKey = (key: string): key is CardCategory =>
          key !== "all" &&
          group.cards.length > 0 &&
          group.cards[0].category === key;

        if (isCategoryKey(group.key)) {
          return (
            <DroppableCategory
              key={group.key}
              category={group.key}
              cards={group.cards}
              onRemoveCard={onRemoveCard}
              onMoveToMaybeboard={onMoveToMaybeboard}
              violationCardIds={violationCardIds}
            />
          );
        }
        return (
          <GenericGroup
            key={group.key}
            label={group.label}
            cards={group.cards}
            onRemoveCard={onRemoveCard}
            onMoveToMaybeboard={onMoveToMaybeboard}
            violationCardIds={violationCardIds}
          />
        );
      })}
    </>
  );
}
