"use client";
/**
 * The "Add to another deck…" picker of a deck row (I-37): the player picks a
 * zone, then one of their other decks, and one copy of the row's printing is
 * added there. The open deck is never changed.
 *
 * Deck-building context. The dialog composes the zone choice, the deck list
 * (`OtherDeckList`) and the add's outcome; `useAddToOtherDeck` does the work.
 * It closes once the copy is stored, and stays open on the copy limit or a
 * failure, with a retry.
 *
 * @module deck/AddToOtherDeckDialog
 */
import { useTranslations } from "next-intl";
import { useState } from "react";
import { OtherDeckList } from "@/components/deck/OtherDeckList";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/components/ui/utils";
import {
  useAddToOtherDeck,
  ZONE_LABEL_KEYS,
  type AddToOtherDeckStatus,
  type OtherDeckChoice,
} from "@/hooks/useAddToOtherDeck";
import type { DeckCard, DeckZone } from "@/lib/deck/types";

/** The zones a card can be sent to, in the order the editor shows them. */
const ZONES: readonly DeckZone[] = ["main", "sideboard", "maybeboard"];

interface AddToOtherDeckDialogProps {
  /** The open deck's row; its printing is the one added. */
  readonly card: DeckCard;
  /** The deck open in the editor, which is never offered. */
  readonly openDeckId: string;
  readonly onClose: () => void;
}

/** Main, Sideboard or Considering; Main until the player picks another. */
function ZoneChoice({
  zone,
  onChange,
}: {
  readonly zone: DeckZone;
  readonly onChange: (zone: DeckZone) => void;
}) {
  const t = useTranslations("builder");
  return (
    <fieldset className="flex flex-wrap items-center gap-3 border-0 px-5 pt-4 text-sm text-[var(--text-primary)]">
      <legend className="sr-only">{t("rowAddElsewhere.zoneLabel")}</legend>
      {ZONES.map((option) => (
        <label key={option} className="flex items-center gap-1.5">
          <input
            type="radio"
            name="other-deck-zone"
            value={option}
            checked={zone === option}
            onChange={() => onChange(option)}
          />
          {t(ZONE_LABEL_KEYS[option])}
        </label>
      ))}
    </fieldset>
  );
}

/** The add's outcome while the dialog stays open: saving, at the limit, or failed with a retry. */
function AddOutcome({
  status,
  cardName,
  onRetry,
}: {
  readonly status: AddToOtherDeckStatus;
  readonly cardName: string;
  readonly onRetry: (deck: OtherDeckChoice, zone: DeckZone) => void;
}) {
  const t = useTranslations("builder.rowAddElsewhere");
  const className = "block px-5 pt-3 text-sm";
  switch (status.kind) {
    case "idle":
      return null;
    case "saving":
      return <output className={className}>{t("saving")}</output>;
    case "atLimit":
      return (
        <output className={className}>
          {t("atLimit", { deck: status.deckName })}
        </output>
      );
    case "failed":
      return (
        <div role="alert" className={cn(className, "flex items-center gap-3")}>
          <span>
            {t("addFailed", { name: cardName, deck: status.deck.name })}
          </span>
          <button
            type="button"
            onClick={() => onRetry(status.deck, status.zone)}
            className="rounded px-2 py-1 text-[var(--accent-text)] hover:bg-[var(--surface-hover)]"
          >
            {t("retry")}
          </button>
        </div>
      );
    default: {
      const unknownStatus: never = status;
      return unknownStatus;
    }
  }
}

/**
 * Picks another deck and a zone for one copy of the row's card.
 */
export function AddToOtherDeckDialog({
  card,
  openDeckId,
  onClose,
}: AddToOtherDeckDialogProps) {
  const t = useTranslations("builder.rowAddElsewhere");
  const [zone, setZone] = useState<DeckZone>("main");
  const { status, addTo } = useAddToOtherDeck(card);

  const add = async (deck: OtherDeckChoice, chosenZone: DeckZone) => {
    if (await addTo(deck, chosenZone)) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("dialogTitle", { name: card.name })}
      maxWidth="max-w-md"
    >
      <ZoneChoice zone={zone} onChange={setZone} />
      <AddOutcome
        status={status}
        cardName={card.name}
        onRetry={(deck, retryZone) => void add(deck, retryZone)}
      />
      <OtherDeckList
        openDeckId={openDeckId}
        disabled={status.kind === "saving"}
        onPick={(deck) => void add(deck, zone)}
      />
    </Modal>
  );
}
