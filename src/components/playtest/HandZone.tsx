"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Plus } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { PlaytestCardImage } from "@/components/playtest/PlaytestCardImage";
import type { DeckCard } from "@/lib/deck/types";
import { useLocalizeDeckCard } from "@/components/card/LocalizedDeckTextContext";
import {
  MulliganBottomChoice,
  type BottomChoiceRequest,
} from "@/components/playtest/MulliganBottomChoice";

interface HandZoneProps {
  readonly hand: readonly DeckCard[];
  readonly libraryCount: number;
  readonly onDrawCard: () => void;
  readonly onMoveCard: (
    cardId: string,
    to: "battlefield" | "graveyard"
  ) => void;
  /** Set while a mulligan waits for the cards to bottom; replaces the hand actions. */
  readonly bottomChoice?: BottomChoiceRequest;
}

interface CardContextMenu {
  readonly cardId: string;
  readonly cardName: string;
}

export function HandZone({
  hand,
  libraryCount,
  onDrawCard,
  onMoveCard,
  bottomChoice,
}: HandZoneProps) {
  const t = useTranslations("playtest.hand");
  const localize = useLocalizeDeckCard();
  const [showCards, setShowCards] = useState(false);
  const [contextMenu, setContextMenu] = useState<CardContextMenu | null>(null);
  const isEmpty = libraryCount === 0;

  function handleCardClick(card: DeckCard) {
    setContextMenu(
      contextMenu?.cardId === card.id
        ? null
        : { cardId: card.id, cardName: card.name }
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--text-primary)] font-semibold text-sm">
          {t("count", { count: hand.length })}
        </h3>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span>{t("deckCount", { count: libraryCount })}</span>
          {isEmpty && (
            <span className="text-orange-400">{t("emptyDeck")}</span>
          )}
        </div>
      </div>

      {bottomChoice ? (
        <MulliganBottomChoice hand={hand} {...bottomChoice} />
      ) : (
        <>
          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDrawCard}
              disabled={isEmpty}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors",
                isEmpty
                  ? "bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-not-allowed"
                  : "bg-blue-600/20 hover:bg-blue-600/40 text-blue-300"
              )}
            >
              <Plus size={14} />
              {t("draw")}
            </button>
            <button
              type="button"
              onClick={() => setShowCards((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] rounded-lg text-xs text-[var(--text-secondary)] transition-colors"
            >
              {showCards ? <EyeOff size={14} /> : <Eye size={14} />}
              {t(showCards ? "hideCards" : "showCards")}
            </button>
          </div>

          {/* Hand cards */}
          {hand.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hand.map((card) => {
                const view = localize(card);
                return (
                <div key={card.id} className="relative">
                  <button
                    type="button"
                    onClick={() => handleCardClick(card)}
                    className="relative w-14 rounded-md overflow-hidden hover:scale-105 transition-transform"
                    aria-label={showCards ? view.name : t("cardBack")}
                  >
                    <PlaytestCardImage
                      src={showCards ? view.imageUri || CARD_BACK_URL : CARD_BACK_URL}
                      alt={showCards ? view.name : t("cardBack")}
                    />
                    {showCards && <span className="sr-only">{view.name}</span>}
                  </button>
                  {showCards && (
                    <p className="text-[9px] text-[var(--text-secondary)] text-center truncate max-w-14 mt-0.5">
                      {view.name}
                    </p>
                  )}

                  {/* Context menu */}
                  {contextMenu?.cardId === card.id && (
                    <div className="absolute bottom-full left-0 mb-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-10 min-w-[140px] overflow-hidden">
                      <p className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border)] truncate">
                        {view.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onMoveCard(card.id, "battlefield");
                          setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        → {t("toBattlefield")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onMoveCard(card.id, "graveyard");
                          setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        → {t("toGraveyard")}
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
