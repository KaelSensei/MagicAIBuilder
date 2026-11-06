"use client";

import { useDraggable } from "@dnd-kit/core";
import { Bookmark, GripVertical, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { CardImage } from "@/components/card/CardImage";
import { cn } from "@/components/ui/utils";
import type { CardCategory, DeckCard } from "@/lib/deck/types";

const EDITABLE_CATEGORIES: readonly CardCategory[] = [
  "creature", "instant", "sorcery", "artifact", "enchantment", "planeswalker",
  "land", "ramp", "draw", "removal", "boardWipe", "winCondition", "protection", "other",
];

interface GridZoneCardProps {
  readonly card: DeckCard;
  readonly isViolation: boolean;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly onMoveToMaybeboard?: (id: string) => void;
  readonly onMoveToSideboard?: (id: string) => void;
  readonly onChangeCategory?: (id: string, category: CardCategory) => void;
}

/**
 * One main-deck card in grid view.
 *
 * The grip starts a cross-zone drag. Move, remove, and category controls stay
 * available without dragging, including on touch screens.
 *
 * @param props - Card and its editor actions
 * @returns The grid cell
 */
export function GridZoneCard({
  card,
  isViolation,
  onRemoveCard,
  onCardClick,
  onMoveToMaybeboard,
  onMoveToSideboard,
  onChangeCategory,
}: GridZoneCardProps) {
  const t = useTranslations("builder");
  const tCard = useTranslations("card");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `deck-grid-card-${card.id}`,
    data: { cardId: card.id, sourceCategory: card.category },
  });

  return (
    <div ref={setNodeRef} className={cn("relative group/card", isDragging && "opacity-40")}>
      <button
        type="button"
        className="absolute top-1 right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        aria-label={t("actions.dragToZone", { name: card.name })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
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
          isViolation && "ring-2 ring-red-500/70 opacity-70 hover:opacity-100"
        )}
        onClick={() => onCardClick?.(card)}
        cardFaces={card.cardFaces}
        isFlexibleLand={card.isFlexibleLand}
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMoveToMaybeboard?.(card.id);
        }}
        className={cn(
          "absolute left-1 z-10 flex items-center justify-center rounded-full bg-black/75 text-white opacity-0 shadow-lg transition-opacity hover:bg-amber-500/90 focus-visible:bg-amber-500/90 focus-visible:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:h-8 [@media(hover:none)]:w-8 [@media(hover:none)]:opacity-100",
          onChangeCategory ? "bottom-10 h-6 w-6" : "bottom-1 h-6 w-6"
        )}
        aria-label={t("zoneMoveTargets.toMaybeboard")}
        title={t("zoneMoveTargets.toMaybeboard")}
      >
        <Bookmark className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMoveToSideboard?.(card.id);
        }}
        className={cn(
          "absolute right-1 z-10 flex items-center justify-center rounded-full bg-black/75 text-white opacity-0 shadow-lg transition-opacity hover:bg-sky-500/90 focus-visible:bg-sky-500/90 focus-visible:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:h-8 [@media(hover:none)]:w-8 [@media(hover:none)]:opacity-100",
          onChangeCategory ? "bottom-10 h-6 w-6" : "bottom-1 h-6 w-6"
        )}
        aria-label={tCard("moveNamedToSideboard", { name: card.name })}
        title={t("zoneMoveTargets.toSideboard")}
      >
        <Layers className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemoveCard(card.id);
        }}
        className="absolute top-1 left-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-600/80 text-xs text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 focus-visible:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:h-8 [@media(hover:none)]:w-8 [@media(hover:none)]:opacity-100"
        aria-label={t("actions.removeCard", { name: card.name })}
      >
        ×
      </button>
      {onChangeCategory && (
        <select
          aria-label={t("actions.changeCategoryFor", { name: card.name })}
          value={card.category}
          onChange={(event) => {
            const category = EDITABLE_CATEGORIES.find(
              (candidate) => candidate === event.currentTarget.value
            );
            if (category) onChangeCategory(card.id, category);
          }}
          className="mt-1 h-8 w-full min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] px-1 text-xs text-[var(--text-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          {EDITABLE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${category}`)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
