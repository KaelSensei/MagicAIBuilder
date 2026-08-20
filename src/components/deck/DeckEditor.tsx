"use client";
// Main deck editor with drag & drop zones, category drag, and grid/list toggle
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { CardImage } from "@/components/card/CardImage";
import { CardListItem } from "@/components/card/CardListItem";
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
import { BulkSelectBar } from "@/components/deck/BulkSelectBar";
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

type BannerManaColor = "W" | "U" | "B" | "R" | "G" | "C";

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

function DroppableZone({
  zone,
  children,
}: {
  readonly zone: "sideboard" | "maybeboard";
  readonly children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `deck-zone-${zone}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-24 rounded transition-colors",
        isOver && "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40"
      )}
    >
      {children}
    </div>
  );
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

const MANA_BANNER_KEYS: Record<BannerManaColor, string> = {
  W: "W",
  U: "U",
  B: "B",
  R: "R",
  G: "G",
  C: "C",
};

const COLOR_IDENTITY_BANNER_BACKGROUND =
  "linear-gradient(135deg, rgba(84, 97, 120, 0.74), rgba(28, 34, 46, 0.96))";

const COLOR_IDENTITY_BANNER_OVERLAY =
  "radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.08), transparent 45%)";

/**
 * Check whether a raw identity symbol can be rendered as a mana-color banner pip.
 *
 * @param color Raw identity symbol from deck data.
 * @returns `true` when the value is a supported mana-color symbol.
 */
function isBannerManaColor(color: string): color is BannerManaColor {
  return ["W", "U", "B", "R", "G", "C"].includes(color);
}

/**
 * Normalize a card color identity into unique display symbols, with `C` for colorless.
 *
 * @param colorIdentity Raw deck-card color identity.
 * @returns Ordered unique symbols suitable for banner rendering.
 */
function getDisplayColorIdentity(
  colorIdentity: readonly string[]
): readonly BannerManaColor[] {
  const normalized = Array.from(
    new Set(
      colorIdentity
        .map((color) => color.toUpperCase())
        .filter(isBannerManaColor)
    )
  );

  return normalized.length > 0 ? normalized : ["C"];
}

/**
 * Build the Scryfall SVG URL for a mana symbol used in the banner.
 *
 * @param color Supported mana color symbol.
 * @returns Remote SVG asset URL.
 */
function getBannerManaSymbolUrl(color: BannerManaColor): string {
  return `https://svgs.scryfall.io/card-symbols/${color}.svg`;
}

/**
 * Build the i18n key for a banner mana color label.
 *
 * @param color Supported mana color symbol.
 * @returns The mana-color key used to look up a translated label.
 */
function getBannerManaColorKey(color: BannerManaColor): string {
  return MANA_BANNER_KEYS[color];
}

/**
 * Decorative banner for a commander slot, using identity symbols on a neutral surface.
 *
 * @param props Banner content, colors, and remove action for the slot.
 * @returns A dismissible slot banner that replaces the old commander art crop.
 */
export function ColorIdentityBanner({
  name,
  colorIdentity,
  onRemove,
  label,
}: {
  readonly name: string;
  readonly colorIdentity: readonly string[];
  readonly onRemove: () => void;
  readonly label?: string;
}) {
  const t = useTranslations("builder");
  const displayColors = useMemo(
    () => getDisplayColorIdentity(colorIdentity),
    [colorIdentity]
  );

  return (
    <div
      className="group/banner relative flex-1 h-[82px] overflow-hidden rounded-lg border border-white/10 text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
      style={{ backgroundImage: COLOR_IDENTITY_BANNER_BACKGROUND }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: COLOR_IDENTITY_BANNER_OVERLAY }}
      />
      <div className="relative z-10 flex h-full items-end justify-between gap-4 px-3 py-2">
        <div className="min-w-0 flex-1 space-y-1">
          {label && (
            <div className="inline-flex rounded bg-yellow-400/90 px-1 text-[8px] font-bold leading-tight text-black">
              {label}
            </div>
          )}
          <p
            className="max-w-[16rem] truncate text-sm font-semibold tracking-[0.01em]"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            {name}
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-white/12 bg-white/10 px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            {displayColors.map((color) => (
              <div
                key={`${label ?? "slot"}-${color}`}
                className="relative rounded-full ring-1 ring-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
              >
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.5),_transparent_42%)]" />
                <Image
                  src={getBannerManaSymbolUrl(color)}
                  alt={t("manaSymbolAlt", {
                    color: t(`manaColors.${getBannerManaColorKey(color)}`),
                  })}
                  width={34}
                  height={34}
                  unoptimized
                  className="relative h-8 w-8 drop-shadow-[0_3px_8px_rgba(0,0,0,0.28)]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 opacity-0 group-hover/banner:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg"
        title={t("actions.removeNamed", { name })}
      >
        ×
      </button>
    </div>
  );
}

// ─── Grid class helper ────────────────────────────────────────────────────────

const GRID_COLS_MAP: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  8: "grid-cols-8",
};
function gridColsClass(cols: number): string {
  return cn("grid gap-1 p-1", GRID_COLS_MAP[cols] ?? "grid-cols-4");
}

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

interface SecondaryZoneContentProps {
  readonly zone: "sideboard" | "maybeboard";
  readonly cards: Deck["cards"];
  readonly viewMode: "grid" | "list";
  readonly gridCols: number;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly moveCardToZone: (id: string, zone: DeckZone) => void;
}

function SecondaryZoneContent({
  zone,
  cards,
  viewMode,
  gridCols,
  onRemoveCard,
  onCardClick,
  moveCardToZone,
}: SecondaryZoneContentProps) {
  const t = useTranslations("builder");

  const moveTargets = useMemo(() => {
    const targets: Record<
      "sideboard" | "maybeboard",
      ReadonlyArray<{ zone: DeckZone; label: string; title: string }>
    > = {
      sideboard: [
        {
          zone: "main",
          label: `→ ${t("zones.main")}`,
          title: t("zoneMoveTargets.toMain"),
        },
        {
          zone: "maybeboard",
          label: `→ ${t("zones.considering")}`,
          title: t("zoneMoveTargets.toMaybeboard"),
        },
      ],
      maybeboard: [
        {
          zone: "main",
          label: `→ ${t("zones.main")}`,
          title: t("zoneMoveTargets.toMain"),
        },
        {
          zone: "sideboard",
          label: `→ ${t("zones.sideboard")}`,
          title: t("zoneMoveTargets.toSideboard"),
        },
      ],
    };
    return targets[zone];
  }, [zone, t]);
  const bulkMoveToZone = useDeckStore((s) => s.bulkMoveToZone);
  const bulkRemoveCards = useDeckStore((s) => s.bulkRemoveCards);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  const toggleSelect = useCallback(
    (id: string, shiftKey = false) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (shiftKey && lastSelected) {
          // Range select: toggle all cards between lastSelected and id
          const ids = cards.map((c) => c.id);
          const a = ids.indexOf(lastSelected);
          const b = ids.indexOf(id);
          const [from, to] = a <= b ? [a, b] : [b, a];
          for (let i = from; i <= to; i++) {
            if (next.has(ids[i])) next.delete(ids[i]);
            else next.add(ids[i]);
          }
        } else if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setLastSelected(id);
    },
    [cards, lastSelected]
  );

  const handleSelectAll = useCallback(() => {
    setSelected(new Set(cards.map((c) => c.id)));
  }, [cards]);

  const handleDeselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleBulkMove = useCallback(
    async (targetZone: DeckZone) => {
      const ids = [...selected];
      setSelected(new Set());
      setLastSelected(null);
      await bulkMoveToZone(ids, targetZone);
    },
    [selected, bulkMoveToZone]
  );

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selected];
    setSelected(new Set());
    setLastSelected(null);
    await bulkRemoveCards(ids);
  }, [selected, bulkRemoveCards]);

  const handleSingleRemove = useCallback(
    (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onRemoveCard(id);
    },
    [onRemoveCard]
  );

  const bulkMoveTargets = moveTargets.map(({ zone: z, label }) => ({
    zone: z,
    label,
  }));

  let content: React.ReactNode;

  if (cards.length === 0) {
    content = (
      <div className="flex items-center justify-center h-24 text-[var(--text-secondary)] text-xs italic">
        {t(`zoneEmpty.${zone}`)}
      </div>
    );
  } else if (viewMode === "grid") {
    content = (
      <div className={gridColsClass(gridCols)}>
        {cards.map((card) => {
          const isSelected = selected.has(card.id);
          return (
            <div key={card.id} className="relative group/card">
              {/* Checkbox overlay */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(card.id, e.shiftKey);
                }}
                className={cn(
                  "absolute top-1 right-1 z-20 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)] opacity-100"
                    : "border-white/60 bg-black/40 opacity-0 group-hover/card:opacity-100"
                )}
                aria-label={
                  isSelected ? `Deselect ${card.name}` : `Select ${card.name}`
                }
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <span className="text-white text-[9px] font-bold">✓</span>
                )}
              </button>
              {/* Highlight ring when selected */}
              {isSelected && (
                <div className="absolute inset-0 rounded ring-2 ring-[var(--accent)] z-10 pointer-events-none" />
              )}
              <CardImage
                imageUri={card.imageUri}
                largeUri={card.imageUri}
                name={card.name}
                manaCost={card.manaCost}
                cmc={card.cmc}
                showOverlay={!card.cardFaces}
                zoomOnHover={false}
                className="w-full cursor-pointer"
                onClick={() => onCardClick?.(card)}
                cardFaces={card.cardFaces}
                isFlexibleLand={card.isFlexibleLand}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSingleRemove(card.id);
                }}
                className="absolute top-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-10"
                aria-label={t("actions.removeCard", { name: card.name })}
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => moveCardToZone(card.id, "main")}
                className="absolute bottom-1 left-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/70 text-white text-[8px] px-1 rounded z-10"
                title={t("zoneMoveTargets.toMain")}
              >
                →M
              </button>
            </div>
          );
        })}
      </div>
    );
  } else {
    content = (
      <>
        {cards.map((card) => {
          const isSelected = selected.has(card.id);
          return (
            <div
              key={card.id}
              className={cn(
                "flex items-center gap-1 group/zone rounded transition-colors",
                isSelected && "bg-[var(--accent)]/8"
              )}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={(e) => toggleSelect(card.id, e.shiftKey)}
                className={cn(
                  "shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ml-1",
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[var(--border)] opacity-0 group-hover/zone:opacity-100"
                )}
                aria-label={
                  isSelected ? `Deselect ${card.name}` : `Select ${card.name}`
                }
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <span className="text-white text-[8px] font-bold leading-none">
                    ✓
                  </span>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <CardListItem card={card} onRemove={handleSingleRemove} />
              </div>
              <div className="shrink-0 flex gap-0.5 opacity-0 group-hover/zone:opacity-100 transition-opacity">
                {moveTargets.map(({ zone: z, label, title }) => (
                  <button
                    type="button"
                    key={z}
                    onClick={() => moveCardToZone(card.id, z)}
                    className="text-[10px] px-1 py-0.5 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title={title}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <BulkSelectBar
        selectedCount={selected.size}
        totalCount={cards.length}
        moveTargets={bulkMoveTargets}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkMove={handleBulkMove}
        onBulkDelete={handleBulkDelete}
      />
      <DroppableZone zone={zone}>{content}</DroppableZone>
    </div>
  );
}

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
