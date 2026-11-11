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
 * stepper, "set as commander" and "change printing" went when 95c93075 (#163)
 * rewrote the row for double-faced cards.
 *
 * @module card/CardRowActions
 */
import { Crown, Image as ImageIcon, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CardNoteInline } from "@/components/card/CardNoteInline";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import { cn } from "@/components/ui/utils";
import { isCommanderEligible } from "@/lib/deck/commander-eligibility";
import { maxQuantity } from "@/lib/deck/multiples";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

const STEP_BUTTON =
  "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--text-secondary)] transition-opacity opacity-0";
const STEP_BUTTON_ENABLED =
  "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100 hover:text-[var(--accent-text)]";
const STEP_BUTTON_DISABLED = "group-hover:opacity-20 cursor-not-allowed";
const ROW_BUTTON =
  "opacity-0 group-hover:opacity-60 focus-visible:opacity-100 hover:!opacity-100 transition-opacity p-0.5 rounded text-[var(--text-secondary)]";

/**
 * The row's card in the Scryfall shape that the catalogue rules and the
 * printing selector read. It carries only what the row stored; nothing is
 * invented to fill the type. The id is the row's printing, so the selector
 * opens on the printing the deck holds.
 */
function asCatalogCard(card: DeckCard): ScryfallCard {
  return {
    id: card.scryfallId ?? card.id,
    name: card.name,
    mana_cost: card.manaCost,
    cmc: card.cmc,
    type_line: card.typeLine,
    oracle_text: card.oracleText,
    color_identity: card.colorIdentity,
    power: card.power ?? undefined,
    toughness: card.toughness ?? undefined,
    layout: card.layout,
    image_uris: card.imageUri ? { grid: card.imageUri } : undefined,
    prices: card.price === null ? undefined : { usd: String(card.price) },
    card_faces: card.cardFaces?.map((face) => ({
      name: face.name,
      mana_cost: face.manaCost,
      type_line: face.typeLine,
      oracle_text: face.oracleText,
    })),
  };
}

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
 * Makes the row's card the deck's commander, through `promoteToCommander`.
 *
 * The store takes the card out of the deck list and calls `setCommander`, so
 * the deck's pairing rule decides whether the current partner stays. The
 * button shows only on a card that can be a commander.
 */
function SetAsCommanderButton({ card }: { readonly card: DeckCard }) {
  const t = useTranslations("card");
  const promoteToCommander = useDeckStore((s) => s.promoteToCommander);
  // CR 903.3: a legendary creature, Vehicle or Spacecraft with a power/toughness
  // box; CR 903.3a: or a card whose text says it can be your commander.
  if (!isCommanderEligible(asCatalogCard(card))) return null;
  return (
    <button
      type="button"
      onClick={() => void promoteToCommander(card.id)}
      aria-label={t("setAsCommanderNamed", { name: card.name })}
      title={t("setAsCommander")}
      className={cn(ROW_BUTTON, "hover:text-yellow-400")}
    >
      <Crown className="w-3 h-3" aria-hidden="true" />
    </button>
  );
}

/**
 * Opens the printing selector for the row and saves the chosen printing with
 * `swapCardPrinting`, which keeps the row's quantity, zone, category and note.
 */
function ChangePrintingButton({ card }: { readonly card: DeckCard }) {
  const t = useTranslations("card");
  const [isOpen, setIsOpen] = useState(false);
  const swapCardPrinting = useDeckStore((s) => s.swapCardPrinting);
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("changePrintingNamed", { name: card.name })}
        title={t("changePrinting")}
        className={cn(ROW_BUTTON, "hover:text-[var(--accent-text)]")}
      >
        <ImageIcon className="w-3 h-3" aria-hidden="true" />
      </button>
      {isOpen && (
        <PrintingSelectorModal
          card={asCatalogCard(card)}
          onSelect={(printing) => void swapCardPrinting(card.id, printing)}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

/**
 * The row's edit buttons: the note (when `showNotes` is set), "set as
 * commander" (on a card that can be one) and "change printing".
 */
export function CardRowActions({ card, showNotes }: CardRowActionsProps) {
  return (
    <>
      {showNotes && (
        <CardNoteInline
          cardId={card.id}
          cardName={card.name}
          notes={card.notes}
        />
      )}
      <SetAsCommanderButton card={card} />
      <ChangePrintingButton card={card} />
    </>
  );
}
