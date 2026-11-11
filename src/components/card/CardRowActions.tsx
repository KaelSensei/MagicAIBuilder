"use client";
/**
 * The editing controls of a deck card row in the editor's list view.
 *
 * Deck-building context. `CardListItem` draws the row; this module holds the
 * controls that change the card through the deck store, so the row stays a
 * layout of badges and buttons. The controls act on the active deck, as every
 * store action does.
 *
 * These controls were orphaned: `CardNoteInline` was never mounted, because
 * `CardListItem` ignored its `showNotes` prop (since #156), and the quantity
 * stepper went when 95c93075 (#163) rewrote the row for double-faced cards.
 *
 * @module card/CardRowActions
 */
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { CardNoteInline } from "@/components/card/CardNoteInline";
import { cn } from "@/components/ui/utils";
import { maxQuantity } from "@/lib/deck/multiples";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";

const STEP_BUTTON =
  "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--text-secondary)] transition-opacity opacity-0";
const STEP_BUTTON_ENABLED =
  "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100 hover:text-[var(--accent-text)]";
const STEP_BUTTON_DISABLED = "group-hover:opacity-20 cursor-not-allowed";

/**
 * The row's copy count, with − and + around it when the count can change.
 *
 * The limit is `maxQuantity`, the rule `updateCardQuantity` clamps to, so the
 * buttons never offer a step the store would refuse. A card the deck may hold
 * only once shows the bare count at one copy, since neither button could do
 * anything there; above its limit (an import of "2 Sol Ring") it keeps − so
 * the player can bring it back down. The count never goes below one: removing
 * the card is the row's × button.
 */
export function CardQuantityStepper({ card }: { readonly card: DeckCard }) {
  const t = useTranslations("card.quantity");
  const updateCardQuantity = useDeckStore((s) => s.updateCardQuantity);
  // CR 903.5b: one copy of each card but basic lands. A card whose own text
  // allows more wins over that rule (CR 101.1): "any number", or Seven Dwarves.
  const limit = maxQuantity(card.name, card.typeLine, card.oracleText);
  const count = (
    <span className="text-xs text-[var(--text-secondary)] w-4 text-center shrink-0">
      {card.quantity}
    </span>
  );
  if (limit <= 1 && card.quantity <= 1) return count;

  const canRemove = card.quantity > 1;
  const canAdd = card.quantity < limit;
  return (
    <div
      role="group"
      aria-label={t("group", { name: card.name })}
      className="flex items-center shrink-0"
    >
      <button
        type="button"
        disabled={!canRemove}
        onClick={() => void updateCardQuantity(card.id, -1)}
        aria-label={t("remove", { name: card.name })}
        className={cn(
          STEP_BUTTON,
          canRemove ? STEP_BUTTON_ENABLED : STEP_BUTTON_DISABLED
        )}
      >
        <Minus className="w-2.5 h-2.5" aria-hidden="true" />
      </button>
      {count}
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => void updateCardQuantity(card.id, 1)}
        aria-label={t("add", { name: card.name })}
        className={cn(
          STEP_BUTTON,
          canAdd ? STEP_BUTTON_ENABLED : STEP_BUTTON_DISABLED
        )}
      >
        <Plus className="w-2.5 h-2.5" aria-hidden="true" />
      </button>
    </div>
  );
}

interface CardRowActionsProps {
  readonly card: DeckCard;
  /** Whether the row offers a private note; the editor shows it on main-deck rows. */
  readonly showNotes: boolean;
}

/**
 * The note button of a deck card row, which opens the inline note editor.
 *
 * Renders nothing when `showNotes` is false.
 */
export function CardRowActions({ card, showNotes }: CardRowActionsProps) {
  if (!showNotes) return null;
  return (
    <CardNoteInline cardId={card.id} cardName={card.name} notes={card.notes} />
  );
}
