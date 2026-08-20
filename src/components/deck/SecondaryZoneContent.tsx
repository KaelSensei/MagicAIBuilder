"use client";
/**
 * The sideboard and considering (maybeboard) zones.
 *
 * Split out of `DeckEditor` — everything it needs arrives as props, so the cut
 * needed no prop threading. `DroppableZone` came with it because nothing else
 * used it; `gridColsClass` did not, because the main zone shares it.
 *
 * @module deck/SecondaryZoneContent
 */

import { useDroppable } from "@dnd-kit/core";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CardImage } from "@/components/card/CardImage";
import { CardListItem } from "@/components/card/CardListItem";
import { BulkSelectBar } from "@/components/deck/BulkSelectBar";
import { gridColsClass } from "@/components/deck/grid-cols";
import { cn } from "@/components/ui/utils";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck, DeckCard, DeckZone } from "@/lib/deck/types";

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

export interface SecondaryZoneContentProps {
  readonly zone: "sideboard" | "maybeboard";
  readonly cards: Deck["cards"];
  readonly viewMode: "grid" | "list";
  readonly gridCols: number;
  readonly onRemoveCard: (id: string) => void;
  readonly onCardClick?: (card: DeckCard) => void;
  readonly moveCardToZone: (id: string, zone: DeckZone) => void;
}

export function SecondaryZoneContent({
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
