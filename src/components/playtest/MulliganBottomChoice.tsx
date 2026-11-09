"use client";
import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { PlaytestCardImage } from "@/components/playtest/PlaytestCardImage";
import type { DeckCard } from "@/lib/deck/types";
import { useLocalizeDeckCard } from "@/components/card/LocalizedDeckTextContext";

/** A pending London mulligan: how many cards to bottom and how to settle it. */
export interface BottomChoiceRequest {
  /** Cards the player must put on the bottom. */
  readonly count: number;
  /** Receives the chosen card ids, in the order they go to the bottom. */
  readonly onConfirm: (cardIds: readonly string[]) => void;
  /** Takes the mulligan back. */
  readonly onUndo: () => void;
}

interface MulliganBottomChoiceProps extends BottomChoiceRequest {
  readonly hand: readonly DeckCard[];
}

/**
 * Lets the player choose which cards a London mulligan puts on the bottom of
 * the library (CR 103.5). Cards are toggle buttons; the order they are chosen
 * is the order they go to the bottom.
 *
 * @param props - the hand, the number of cards to bottom and the callbacks
 * @returns the bottom-choice panel for the hand view
 */
export function MulliganBottomChoice({
  hand,
  count,
  onConfirm,
  onUndo,
}: MulliganBottomChoiceProps) {
  const t = useTranslations("playtest");
  const localize = useLocalizeDeckCard();
  const promptId = useId();
  const [chosenIds, setChosenIds] = useState<readonly string[]>([]);
  const isComplete = chosenIds.length === count;

  // Position of each chosen card, 1-based, for the order badges.
  const positions = useMemo(
    () => new Map(chosenIds.map((id, index) => [id, index + 1])),
    [chosenIds]
  );

  const chosenNames = useMemo(() => {
    const handById = new Map(hand.map((card) => [card.id, card]));
    return chosenIds.flatMap((id) => {
      const card = handById.get(id);
      return card === undefined ? [] : [localize(card).name];
    });
  }, [chosenIds, hand, localize]);

  function handleToggle(cardId: string) {
    setChosenIds((current) => {
      if (current.includes(cardId))
        return current.filter((id) => id !== cardId);
      return current.length < count ? [...current, cardId] : current;
    });
  }

  return (
    <div role="group" aria-labelledby={promptId} className="space-y-3">
      <div className="space-y-1">
        <p
          id={promptId}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {t("hand.bottom.prompt", { count })}
        </p>
        <div
          className="text-xs text-[var(--text-secondary)]"
          aria-live="polite"
        >
          <p>
            {t("hand.bottom.progress", { chosen: chosenIds.length, count })}
          </p>
          {chosenNames.length > 0 && (
            <p>{t("hand.bottom.order", { cards: chosenNames.join(", ") })}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {hand.map((card) => {
          const view = localize(card);
          const position = positions.get(card.id);
          const isChosen = position !== undefined;
          return (
            <div key={card.id} className="relative">
              <button
                type="button"
                aria-pressed={isChosen}
                aria-label={view.name}
                disabled={!isChosen && isComplete}
                onClick={() => handleToggle(card.id)}
                className={cn(
                  "relative block w-14 overflow-hidden rounded-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
                  isChosen
                    ? "ring-2 ring-purple-500"
                    : "hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                )}
              >
                <PlaytestCardImage
                  src={view.imageUri || CARD_BACK_URL}
                  alt=""
                />
                {isChosen && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white"
                  >
                    {position}
                  </span>
                )}
              </button>
              <p className="mt-0.5 max-w-14 truncate text-center text-[9px] text-[var(--text-secondary)]">
                {view.name}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(chosenIds)}
          disabled={!isComplete}
          className="flex-1 rounded-lg bg-purple-600/20 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-600/40 disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-secondary)]"
        >
          {t("hand.bottom.confirm", { count })}
        </button>
        <button
          type="button"
          onClick={onUndo}
          className="rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          ↩ {t("life.undo")}
        </button>
      </div>
    </div>
  );
}
