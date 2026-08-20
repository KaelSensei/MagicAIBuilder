"use client";
// Main deck editor with drag & drop zones, category drag, and grid/list toggle
import { useDroppable } from "@dnd-kit/core";
import { LayoutGrid, List, Rows3 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LocalizedDeckTextProvider } from "@/components/card/LocalizedDeckTextContext";
import { ColorIdentityBanner } from "@/components/deck/ColorIdentityBanner";
import { CompanionZone } from "@/components/deck/CompanionZone";
import { MainZoneContent } from "@/components/deck/MainZoneContent";
import { SecondaryZoneContent } from "@/components/deck/SecondaryZoneContent";
import { SortGroupToolbar } from "@/components/deck/SortGroupToolbar";
import { cn } from "@/components/ui/utils";
import { getColorIdentityViolations } from "@/lib/deck/color-identity";
import { supportsPartner, partnerSlotLabel } from "@/lib/deck/pairing";
import { sortCards, groupCards } from "@/lib/deck/sort";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck, DeckCard } from "@/lib/deck/types";

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
