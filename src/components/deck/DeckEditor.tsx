"use client";
// Main deck editor with drag & drop zones, category drag, and grid/list toggle
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardImage } from "@/components/card/CardImage";
import { CardListItem } from "@/components/card/CardListItem";
import { ColorIdentityBanner } from "@/components/deck/ColorIdentityBanner";
import { SecondaryZoneContent } from "@/components/deck/SecondaryZoneContent";
import { gridColsClass } from "@/components/deck/grid-cols";
import { LocalizedDeckTextProvider } from "@/components/card/LocalizedDeckTextContext";
import { cn } from "@/components/ui/utils";
import type { Deck, DeckCard, CardCategory } from "@/lib/deck/types";

import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  GripVertical,
  Rows3,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useDeckStore } from "@/lib/deck/store";
import { SortGroupToolbar } from "@/components/deck/SortGroupToolbar";
import { supportsPartner, partnerSlotLabel } from "@/lib/deck/pairing";
import { CompanionZone } from "@/components/deck/CompanionZone";
import { sortCards, groupCards } from "@/lib/deck/sort";
import type { CardGroup } from "@/lib/deck/sort";
import {
  getColorIdentityViolations,
  isCompanionOutsideColorIdentity,
} from "@/lib/deck/color-identity";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for upcoming zone-based drag-and-drop feature
type DeckZone = "main" | "sideboard" | "maybeboard";


interface DeckEditorProps {
  readonly deck: Deck;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly className?: string;
  readonly activeZone?: "main" | "sideboard" | "maybeboard";
  readonly onActiveZoneChange?: (
    zone: "main" | "sideboard" | "maybeboard"
  ) => void;
}

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

interface MainZoneContentProps {
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

function MainZoneContent({
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

// ─── Sideboard / Maybeboard sub-component ─────────────────────────────────────


export function DeckEditor({
  deck,
  onRemoveCard,
  onCardClick,
  className,
  activeZone: activeZoneProp,
  onActiveZoneChange,
}: DeckEditorProps) {
  const t = useTranslations("builder");
  const viewMode = useDeckStore((s) => s.deckViewMode);
  const setViewMode = useDeckStore((s) => s.setDeckViewMode);
  const gridCols = useDeckStore((s) => s.deckGridCols);
  const setGridCols = useDeckStore((s) => s.setDeckGridCols);
  const clearCommander = useDeckStore((s) => s.clearCommander);
  const setPartner = useDeckStore((s) => s.setPartner);
  const setCompanion = useDeckStore((s) => s.setCompanion);
  const clearCompanion = useCallback(() => {
    void setCompanion(null);
  }, [setCompanion]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- wired up in upcoming zone-based drag-and-drop feature
  const moveCardToZone = useDeckStore((s) => s.moveCardToZone);
  const moveToMaybeboard = useDeckStore((s) => s.moveToMaybeboard);
  const sortField = useDeckStore((s) => s.sortField);
  const sortDirection = useDeckStore((s) => s.sortDirection);
  const groupBy = useDeckStore((s) => s.groupBy);

  // Active zone tab — controlled from parent when props provided, otherwise local state
  const [activeZoneLocal, setActiveZoneLocal] = useState<DeckZone>("main");
  const activeZone = activeZoneProp ?? activeZoneLocal;
  const setActiveZone = (zone: DeckZone) => {
    setActiveZoneLocal(zone);
    onActiveZoneChange?.(zone);
  };

  // Deduplicate cards by id (guard against import bugs creating duplicate rows)
  const uniqueCards = useMemo(
    () =>
      deck.cards.filter(
        (card, index, arr) => arr.findIndex((c) => c.id === card.id) === index
      ),
    [deck.cards]
  );

  // Cards split by zone
  const mainCards = uniqueCards.filter((c) => c.zone === "main");
  const sideboardCards = uniqueCards.filter((c) => c.zone === "sideboard");
  const maybeboardCards = uniqueCards.filter((c) => c.zone === "maybeboard");

  // Sort then group main-zone cards for list view
  const sortedMainCards = sortCards(mainCards, sortField, sortDirection);
  const cardGroups = groupCards(sortedMainCards, groupBy);

  const violationCardIds = useMemo(() => {
    const ids = new Set<string>();
    for (const v of getColorIdentityViolations(deck)) ids.add(v.cardId);
    return ids;
  }, [deck]);

  // Total only counts main deck + commander/partner (sideboard/maybeboard excluded)
  const totalCards =
    mainCards.reduce((sum, c) => sum + c.quantity, 0) +
    (deck.commander ? 1 : 0) +
    (deck.partner ? 1 : 0);

  // Whether we have a partner to show alongside the commander
  const hasPartner =
    supportsPartner(deck.pairingType) &&
    deck.partner &&
    deck.partner.name !== deck.commander?.name;

  // Top-level droppable — catches any search card dropped anywhere on the deck panel
  const { setNodeRef: setDeckPanelRef } = useDroppable({
    id: `deck-panel-${activeZone}`,
  });

  // Every row this editor renders, across zones — one batch for the whole deck
  const cardNames = useMemo(() => uniqueCards.map((c) => c.name), [uniqueCards]);

  return (
    <LocalizedDeckTextProvider names={cardNames}>
    <div
      ref={setDeckPanelRef}
      className={cn("flex flex-col h-full", className)}
    >
      {/* Commander zone — art crop banner */}
      <div className="p-2 border-b border-[var(--border)]">
        {deck.commander ? (
          <div className="flex gap-1.5">
            <ColorIdentityBanner
              name={deck.commander.name}
              colorIdentity={deck.commander.colorIdentity}
              onRemove={clearCommander}
              label="CMD"
            />
            {/* Partner banner (side by side, 50/50) */}
            {hasPartner && deck.partner && (
              <ColorIdentityBanner
                name={deck.partner.name}
                colorIdentity={deck.partner.colorIdentity}
                onRemove={() => setPartner(null)}
                label={partnerSlotLabel(deck.pairingType)}
              />
            )}
            {/* Partner placeholder when slot is open but not filled */}
            {!hasPartner && supportsPartner(deck.pairingType) && (
              <div className="flex-1 rounded-lg border border-dashed border-[var(--border)] h-[82px] flex items-center justify-center px-2">
                <span className="text-[10px] text-[var(--text-secondary)] italic text-center leading-tight">
                  {t("searchPartner", {
                    partnerLabel: partnerSlotLabel(deck.pairingType),
                  })}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--border)] h-[82px] flex items-center justify-center">
            <p className="text-xs text-[var(--text-secondary)] italic">
              {t("searchCommander")}
            </p>
          </div>
        )}
      </div>

      <CompanionZone deck={deck} deckViewMode={viewMode} />

      {/* Zone tabs: Main / Sideboard / Considering */}
      <div className="px-3 py-1.5 border-b border-[var(--border)] flex items-center justify-between gap-1">
        <div className="flex items-center gap-0">
          {(
            [
              {
                zone: "main" as DeckZone,
                label: t("zones.main"),
                count:
                  mainCards.reduce((s, c) => s + c.quantity, 0) +
                  (deck.commander ? 1 : 0) +
                  (deck.partner ? 1 : 0),
              },
              {
                zone: "sideboard" as DeckZone,
                label: t("zones.sideboard"),
                count: sideboardCards.reduce((s, c) => s + c.quantity, 0),
              },
              {
                zone: "maybeboard" as DeckZone,
                label: t("zones.considering"),
                count: maybeboardCards.reduce((s, c) => s + c.quantity, 0),
              },
            ] as const
          ).map(({ zone, label, count }) => (
            <button
              type="button"
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-xs font-medium border-b-2 transition-colors -mb-[7px] pb-[5px]",
                activeZone === zone
                  ? "border-[var(--accent)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {label}
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  activeZone === zone ? "text-[var(--accent)]" : "opacity-60"
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* View mode toggle — only relevant for main zone */}
        {activeZone === "main" && (
          <div className="flex items-center gap-0.5 ml-auto">
            <p
              className={cn(
                "text-xs font-medium mr-1",
                totalCards === 100
                  ? "text-green-500"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {totalCards}/100
            </p>
            {/* List view */}
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1 rounded transition-colors ${
                viewMode === "list"
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title={t("viewMode.listView")}
            >
              <List className="w-3 h-3" />
            </button>
            {/* Grid view */}
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded transition-colors ${
                viewMode === "grid"
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title={t("viewMode.gridView")}
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            {/* Grid density — only shown in grid mode */}
            {viewMode === "grid" && (
              <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-[var(--border)]">
                <Rows3 className="w-3 h-3 text-[var(--text-secondary)] mr-0.5" />
                {([2, 3, 4, 6, 8] as const).map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setGridCols(n)}
                    className={cn(
                      "w-5 h-5 rounded text-[10px] font-medium transition-colors",
                      gridCols === n
                        ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                    title={t("viewMode.cardsPerRow", { count: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sort & group toolbar — only for main zone */}
      {activeZone === "main" && <SortGroupToolbar />}

      {/* Zone content — uses parent DndContext from BuilderPage (main zone only) */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeZone === "main" && (
          <MainZoneContent
            deck={deck}
            mainCards={sortedMainCards}
            viewMode={viewMode}
            gridCols={gridCols}
            cardGroups={cardGroups}
            violationCardIds={violationCardIds}
            onRemoveCard={onRemoveCard}
            onCardClick={onCardClick}
            clearCommander={clearCommander}
            setPartner={setPartner}
            clearCompanion={clearCompanion}
            onMoveToMaybeboard={moveToMaybeboard}
          />
        )}
        {activeZone === "sideboard" && (
          <SecondaryZoneContent
            zone="sideboard"
            cards={sideboardCards}
            viewMode={viewMode}
            gridCols={gridCols}
            onRemoveCard={onRemoveCard}
            onCardClick={onCardClick}
            moveCardToZone={moveCardToZone}
          />
        )}
        {activeZone === "maybeboard" && (
          <SecondaryZoneContent
            zone="maybeboard"
            cards={maybeboardCards}
            viewMode={viewMode}
            gridCols={gridCols}
            onRemoveCard={onRemoveCard}
            onCardClick={onCardClick}
            moveCardToZone={moveCardToZone}
          />
        )}
      </div>
    </div>
    </LocalizedDeckTextProvider>
  );
}
