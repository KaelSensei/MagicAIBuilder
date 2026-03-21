"use client";
// Main deck editor with drag & drop zones, category drag, and grid/list toggle
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { CardImage } from "@/components/card/CardImage";
import { CardListItem } from "@/components/card/CardListItem";
import { CardTooltip } from "@/components/card/CardTooltip";
import { cn } from "@/components/ui/utils";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/deck/categories";
import type { CardCategory } from "@/lib/deck/types";
import { ChevronDown, ChevronRight, LayoutGrid, List, GripVertical, Rows3 } from "lucide-react";
import React, { useState } from "react";
import { useDeckStore } from "@/lib/deck/store";
import { supportsPartner, partnerSlotLabel } from "@/lib/deck/pairing";
import { DeckDescriptionEditor } from "@/components/deck/DeckDescriptionEditor";
import { DeckTagsEditor } from "@/components/deck/DeckTagsEditor";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type DeckZone = "main" | "sideboard" | "maybeboard";

interface DeckEditorProps {
  readonly deck: Deck;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly className?: string;
  readonly activeZone?: "main" | "sideboard" | "maybeboard";
  readonly onActiveZoneChange?: (zone: "main" | "sideboard" | "maybeboard") => void;
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
  onMoveToMaybeboard,
}: {
  card: DeckCard;
  onRemove: (id: string) => void;
  onMoveToMaybeboard?: (id: string) => void;
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
        <CardListItem card={card} onRemove={onRemove} showNotes />
      </div>
    </div>
  );
}

function getDropZoneClass(isOver: boolean, isEmpty: boolean): string {
  if (isOver) return "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40";
  if (isEmpty) return "min-h-[32px] border border-dashed border-[var(--border)] rounded opacity-40";
  return "min-h-[8px]";
}

function DroppableZone({ zone, children }: { zone: "sideboard" | "maybeboard"; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `deck-zone-${zone}` });
  return (
    <div
      ref={setNodeRef}
      className={cn("min-h-24 rounded transition-colors", isOver && "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40")}
    >
      {children}
    </div>
  );
}

function DroppableCategory({ category, cards, onRemoveCard, onMoveToMaybeboard }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: `deck-category-${category}`,
    data: { category },
  });

  const cardIds = cards.map((c) => `deck-card-${c.id}`);
  const label = CATEGORY_LABELS[category];

  return (
    <div className="mb-2">
      {/* Category header */}
      <button
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
          className={cn("pl-1 rounded transition-colors", getDropZoneClass(isOver, cards.length === 0))}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <DraggableDeckCard
                key={card.id}
                card={card}
                onRemove={onRemoveCard}
                onMoveToMaybeboard={onMoveToMaybeboard}
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
    </div>
  );
}

// Art crop banner for a single commander slot
function CommanderBanner({
  name,
  artCropUri,
  imageUri,
  onRemove,
  label,
}: {
  name: string;
  artCropUri: string;
  imageUri: string;
  onRemove: () => void;
  label?: string;
}) {
  // Prefer artCropUri; fall back to full card image (cropped from top to show face)
  const src = artCropUri || imageUri;
  return (
    <div className="relative rounded-lg overflow-hidden h-[82px] group/banner flex-1">
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover object-top"
        draggable={false}
        unoptimized
      />
      {/* Gradient overlay so the name is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      {/* Commander label badge */}
      {label && (
        <div className="absolute top-1 left-1 bg-yellow-400/90 text-black text-[8px] font-bold px-1 rounded leading-tight">
          {label}
        </div>
      )}
      {/* Commander name */}
      <p
        className="absolute bottom-1.5 left-2 right-6 text-white text-xs font-semibold leading-tight truncate"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {name}
      </p>
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 opacity-0 group-hover/banner:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg"
        title={`Remove ${name}`}
      >
        ×
      </button>
    </div>
  );
}

// ─── Grid class helper ────────────────────────────────────────────────────────

const GRID_COLS_MAP: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 6: "grid-cols-6", 8: "grid-cols-8" };
function gridColsClass(cols: number): string {
  return cn("grid gap-1 p-1", GRID_COLS_MAP[cols] ?? "grid-cols-4");
}

// ─── Main zone sub-component ──────────────────────────────────────────────────

interface MainZoneContentProps {
  readonly deck: Deck;
  readonly mainCards: Deck["cards"];
  readonly viewMode: "grid" | "list";
  readonly gridCols: number;
  readonly cardsByCategory: Record<CardCategory, Deck["cards"]>;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly clearCommander: () => void;
  readonly setPartner: (p: null) => void;
  readonly onMoveToMaybeboard?: (id: string) => void;
}

function MainZoneContent({ deck, mainCards, viewMode, gridCols, cardsByCategory, onRemoveCard, onCardClick, clearCommander, setPartner, onMoveToMaybeboard }: MainZoneContentProps) {
  if (viewMode === "grid") {
    return (
      <div className={gridColsClass(gridCols)}>
        {deck.commander && (
          <div className="relative group/card">
            <CardImage imageUri={deck.commander.imageUri} largeUri={deck.commander.imageUri} name={deck.commander.name} manaCost={deck.commander.manaCost} cmc={deck.commander.cmc} showOverlay={true} zoomOnHover={false} className="w-full ring-2 ring-yellow-400/70 rounded-[4%] cursor-pointer" onClick={() => onCardClick?.(deck.commander!)} />
            <div className="absolute bottom-1 left-1 bg-yellow-400/90 text-black text-[9px] font-bold px-1 rounded leading-tight">CMD</div>
            <button onClick={(e) => { e.stopPropagation(); clearCommander(); }} className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10" title="Remove commander">×</button>
          </div>
        )}
        {deck.partner && deck.partner.name !== deck.commander?.name && (
          <div className="relative group/card">
            <CardImage imageUri={deck.partner.imageUri} largeUri={deck.partner.imageUri} name={deck.partner.name} manaCost={deck.partner.manaCost} cmc={deck.partner.cmc} showOverlay={true} zoomOnHover={false} className="w-full ring-2 ring-yellow-400/70 rounded-[4%] cursor-pointer" onClick={() => onCardClick?.(deck.partner!)} />
            <div className="absolute bottom-1 left-1 bg-yellow-400/90 text-black text-[9px] font-bold px-1 rounded leading-tight">CMD</div>
            <button onClick={(e) => { e.stopPropagation(); setPartner(null); }} className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10" title="Remove partner">×</button>
          </div>
        )}
        {mainCards.map((card) => (
          <div key={card.id} className="relative group/card">
            <CardImage imageUri={card.imageUri} largeUri={card.imageUri} name={card.name} manaCost={card.manaCost} cmc={card.cmc} showOverlay={true} zoomOnHover={false} className="w-full cursor-pointer" onClick={() => onCardClick?.(card)} />
            <button onClick={(e) => { e.stopPropagation(); onRemoveCard(card.id); }} className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10" aria-label={`Remove ${card.name}`}>×</button>
          </div>
        ))}
        {!deck.commander && mainCards.length === 0 && (
          <div className="col-span-4 flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm">No cards yet</div>
        )}
      </div>
    );
  }
  return (
    <>
      {CATEGORY_ORDER.filter((c) => c !== "commander").map((category) => (
        <DroppableCategory key={category} category={category} cards={cardsByCategory[category] ?? []} onRemoveCard={onRemoveCard} onMoveToMaybeboard={onMoveToMaybeboard} />
      ))}
    </>
  );
}

// ─── Sideboard / Maybeboard sub-component ─────────────────────────────────────

interface SecondaryZoneContentProps {
  readonly zone: "sideboard" | "maybeboard";
  readonly cards: Deck["cards"];
  readonly viewMode: "grid" | "list";
  readonly gridCols: number;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly moveCardToZone: (id: string, zone: DeckZone) => void;
}

const ZONE_MOVE_TARGETS: Record<"sideboard" | "maybeboard", ReadonlyArray<{ zone: DeckZone; label: string; title: string }>> = {
  sideboard: [
    { zone: "main", label: "→ Main", title: "Move to Main Deck" },
    { zone: "maybeboard", label: "→ Maybe", title: "Move to Considering" },
  ],
  maybeboard: [
    { zone: "main", label: "→ Main", title: "Move to Main Deck" },
    { zone: "sideboard", label: "→ Side", title: "Move to Sideboard" },
  ],
};

const ZONE_EMPTY_TEXT: Record<"sideboard" | "maybeboard", string> = {
  sideboard: "Drop cards here or use search to add to sideboard",
  maybeboard: "Drop cards here or use search to add to considering",
};

function SecondaryZoneContent({ zone, cards, viewMode, gridCols, onRemoveCard, onCardClick, moveCardToZone }: SecondaryZoneContentProps) {
  const moveTargets = ZONE_MOVE_TARGETS[zone];
  let content: React.ReactNode;

  if (cards.length === 0) {
    content = (
      <div className="flex items-center justify-center h-24 text-[var(--text-secondary)] text-xs italic">
        {ZONE_EMPTY_TEXT[zone]}
      </div>
    );
  } else if (viewMode === "grid") {
    content = (
      <div className={gridColsClass(gridCols)}>
        {cards.map((card) => (
          <div key={card.id} className="relative group/card">
            <CardImage imageUri={card.imageUri} largeUri={card.imageUri} name={card.name} manaCost={card.manaCost} cmc={card.cmc} showOverlay={true} zoomOnHover={false} className="w-full cursor-pointer" onClick={() => onCardClick?.(card)} />
            <button onClick={(e) => { e.stopPropagation(); onRemoveCard(card.id); }} className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10" aria-label={`Remove ${card.name}`}>×</button>
            <button onClick={() => moveCardToZone(card.id, "main")} className="absolute bottom-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/70 text-white text-[8px] px-1 rounded z-10" title="Move to Main">→M</button>
          </div>
        ))}
      </div>
    );
  } else {
    content = (
      <>
        {cards.map((card) => (
          <div key={card.id} className="flex items-center gap-1 group/zone">
            <div className="flex-1 min-w-0"><CardListItem card={card} onRemove={onRemoveCard} /></div>
            <div className="shrink-0 flex gap-0.5 opacity-0 group-hover/zone:opacity-100 transition-opacity">
              {moveTargets.map(({ zone: z, label, title }) => (
                <button key={z} onClick={() => moveCardToZone(card.id, z)} className="text-[10px] px-1 py-0.5 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title={title}>{label}</button>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  return <DroppableZone zone={zone}>{content}</DroppableZone>;
}

export function DeckEditor({ deck, onRemoveCard, onCardClick, className, activeZone: activeZoneProp, onActiveZoneChange }: DeckEditorProps) {
  const viewMode = useDeckStore((s) => s.deckViewMode);
  const setViewMode = useDeckStore((s) => s.setDeckViewMode);
  const gridCols = useDeckStore((s) => s.deckGridCols);
  const setGridCols = useDeckStore((s) => s.setDeckGridCols);
  const clearCommander = useDeckStore((s) => s.clearCommander);
  const setPartner = useDeckStore((s) => s.setPartner);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const moveCardToZone = useDeckStore((s) => s.moveCardToZone);
  const moveToMaybeboard = useDeckStore((s) => s.moveToMaybeboard);

  // Active zone tab — controlled from parent when props provided, otherwise local state
  const [activeZoneLocal, setActiveZoneLocal] = useState<DeckZone>("main");
  const activeZone = activeZoneProp ?? activeZoneLocal;
  const setActiveZone = (zone: DeckZone) => {
    setActiveZoneLocal(zone);
    onActiveZoneChange?.(zone);
  };

  // Deduplicate cards by id (guard against import bugs creating duplicate rows)
  const uniqueCards = deck.cards.filter((card, index, arr) =>
    arr.findIndex((c) => c.id === card.id) === index
  );

  // Cards split by zone
  const mainCards = uniqueCards.filter((c) => c.zone === "main");
  const sideboardCards = uniqueCards.filter((c) => c.zone === "sideboard");
  const maybeboardCards = uniqueCards.filter((c) => c.zone === "maybeboard");

  // Group main-zone cards by category (for list view with categories)
  const cardsByCategory = mainCards.reduce<Record<CardCategory, Deck["cards"]>>(
    (acc, card) => {
      acc[card.category] ??= [];
      acc[card.category].push(card);
      return acc;
    },
    {} as Record<CardCategory, Deck["cards"]>
  );

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
  const { setNodeRef: setDeckPanelRef } = useDroppable({ id: `deck-panel-${activeZone}` });

  return (
    <div ref={setDeckPanelRef} className={cn("flex flex-col h-full", className)}>
      {/* Commander zone — art crop banner */}
      <div className="p-2 border-b border-[var(--border)]">
        {deck.commander ? (
          <div className="flex gap-1.5">
            <CommanderBanner
              name={deck.commander.name}
              artCropUri={deck.commander.artCropUri}
              imageUri={deck.commander.imageUri}
              onRemove={clearCommander}
              label="CMD"
            />
            {/* Partner banner (side by side, 50/50) */}
            {hasPartner && deck.partner && (
              <CommanderBanner
                name={deck.partner.name}
                artCropUri={deck.partner.artCropUri}
                imageUri={deck.partner.imageUri}
                onRemove={() => setPartner(null)}
                label={partnerSlotLabel(deck.pairingType)}
              />
            )}
            {/* Partner placeholder when slot is open but not filled */}
            {!hasPartner && supportsPartner(deck.pairingType) && (
              <div className="flex-1 rounded-lg border border-dashed border-[var(--border)] h-[82px] flex items-center justify-center px-2">
                <span className="text-[10px] text-[var(--text-secondary)] italic text-center leading-tight">
                  Search for a {partnerSlotLabel(deck.pairingType)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--border)] h-[82px] flex items-center justify-center">
            <p className="text-xs text-[var(--text-secondary)] italic">
              Search for a commander above
            </p>
          </div>
        )}
      </div>

      {/* Companion zone — sideboard slot, outside the 99 */}
      {deck.companion && (
        <div className="px-3 pb-3 border-b border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
            Companion <span className="text-[10px] normal-case opacity-70">(sideboard)</span>
          </p>
          <CardTooltip card={deck.companion}>
            <span className="text-sm text-[var(--text-primary)] font-medium cursor-default hover:text-[var(--accent)] transition-colors">
              {deck.companion.name}
            </span>
          </CardTooltip>
        </div>
      )}

      {/* Zone tabs: Main / Sideboard / Considering */}
      <div className="px-3 py-1.5 border-b border-[var(--border)] flex items-center justify-between gap-1">
        <div className="flex items-center gap-0">
          {(
            [
              { zone: "main" as DeckZone, label: "Main", count: mainCards.reduce((s, c) => s + c.quantity, 0) + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0) },
              { zone: "sideboard" as DeckZone, label: "Sideboard", count: sideboardCards.reduce((s, c) => s + c.quantity, 0) },
              { zone: "maybeboard" as DeckZone, label: "Considering", count: maybeboardCards.reduce((s, c) => s + c.quantity, 0) },
            ] as const
          ).map(({ zone, label, count }) => (
            <button
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
                totalCards === 100 ? "text-green-500" : "text-[var(--text-secondary)]"
              )}
            >
              {totalCards}/100
            </p>
            {/* List view */}
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
            {/* Grid view */}
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
            {/* Grid density — only shown in grid mode */}
            {viewMode === "grid" && (
              <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-[var(--border)]">
                <Rows3 className="w-3 h-3 text-[var(--text-secondary)] mr-0.5" />
                {([2, 3, 4, 6, 8] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setGridCols(n)}
                    className={cn(
                      "w-5 h-5 rounded text-[10px] font-medium transition-colors",
                      gridCols === n
                        ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                    title={`${n} cards per row`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone content — uses parent DndContext from BuilderPage (main zone only) */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeZone === "main" && (
          <MainZoneContent deck={deck} mainCards={mainCards} viewMode={viewMode} gridCols={gridCols} cardsByCategory={cardsByCategory} onRemoveCard={onRemoveCard} onCardClick={onCardClick} clearCommander={clearCommander} setPartner={setPartner} onMoveToMaybeboard={moveToMaybeboard} />
        )}
        {activeZone === "sideboard" && (
          <SecondaryZoneContent zone="sideboard" cards={sideboardCards} viewMode={viewMode} gridCols={gridCols} onRemoveCard={onRemoveCard} onCardClick={onCardClick} moveCardToZone={moveCardToZone} />
        )}
        {activeZone === "maybeboard" && (
          <SecondaryZoneContent zone="maybeboard" cards={maybeboardCards} viewMode={viewMode} gridCols={gridCols} onRemoveCard={onRemoveCard} onCardClick={onCardClick} moveCardToZone={moveCardToZone} />
        )}
      </div>

    </div>
  );
}
