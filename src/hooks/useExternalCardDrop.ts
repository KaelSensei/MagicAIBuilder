"use client";
/**
 * Adds a card dragged or pasted from another site to the zone the editor shows (I-37).
 *
 * Listens on the window for the browser's native drag, drop and paste events: every drag inside
 * the builder runs through dnd-kit's pointer and keyboard sensors instead, so a native drag that
 * starts in this document (an image in the search results) is left alone. The payload's strings
 * go to the pure `readExternalCardReference`; the card is looked up through the Scryfall client
 * and its queue, never at the dropped address, and added with the store's `addCard`, which
 * applies the copy limit, the warnings and the undo entry as for any other add. A card the deck
 * already holds at its copy limit, counted across the zones the limit covers, is reported before
 * the add, since `addCard` skips it silently.
 *
 * Off while a dialog is open, and a paste into a text field stays the field's own.
 *
 * @module hooks/useExternalCardDrop
 */
import { useEffect, useRef, useState } from "react";
import {
  readExternalCardReference,
  type DroppedPayload,
  type ExternalCardReference,
} from "@/lib/deck/external-card-link";
import { commandZoneExceptions } from "@/lib/deck/color-identity";
import { copiesCountedFor } from "@/lib/deck/counted-copies";
import type { DeckFormat } from "@/lib/deck/formats";
import { deckCopyLimit } from "@/lib/deck/multiples";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck, DeckZone } from "@/lib/deck/types";
import { cardsFromZoneSource } from "@/lib/deck/zone-source";
import {
  getCardById,
  getCardByName,
  getCardByNameFuzzy,
  getCardCollection,
} from "@/lib/scryfall/client";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** What became of one drop or paste, for the caller to tell the player. */
export type ExternalCardDropOutcome =
  | {
      readonly kind: "added";
      readonly cardName: string;
      readonly zone: DeckZone;
    }
  | {
      readonly kind: "at-copy-limit";
      readonly cardName: string;
      readonly format: DeckFormat;
    }
  | { readonly kind: "unreadable-link" }
  | { readonly kind: "lookup-failed" }
  | { readonly kind: "file" };

/** The zone cards land in, and where each outcome is reported. */
export interface UseExternalCardDropOptions {
  readonly zone: DeckZone;
  readonly onOutcome: (outcome: ExternalCardDropOutcome) => void;
}

/** Whether an outside drag is over the window, for the drop hint. */
export interface ExternalCardDropState {
  readonly isDragOver: boolean;
}

/** A reference that names a card to look up. */
type CardReference = Extract<
  ExternalCardReference,
  { readonly kind: "scryfall-id" | "set-number" | "name" }
>;

/** The part of `DataTransfer` the payload is read from; a paste's `clipboardData` has it too. */
type TransferData = Pick<DataTransfer, "types" | "getData">;

/** Any open dialog: Radix dialogs carry the role, native ones the element. */
const OPEN_DIALOG_SELECTOR =
  '[role="dialog"], [role="alertdialog"], dialog[open]';

/** Fields that read a paste themselves. */
const TEXT_ENTRY_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="combobox"]',
].join(", ");

function isDialogOpen(): boolean {
  return document.querySelector(OPEN_DIALOG_SELECTOR) !== null;
}

function isTextEntry(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(TEXT_ENTRY_SELECTOR) !== null
  );
}

function payloadOf(transfer: TransferData): DroppedPayload {
  return {
    uriList: transfer.getData("text/uri-list"),
    plainText: transfer.getData("text/plain"),
    html: transfer.getData("text/html"),
    hasFiles: transfer.types.includes("Files"),
  };
}

/** The printing a set code and collector number name, through Scryfall's collection lookup. */
async function cardBySetNumber(
  set: string,
  collectorNumber: string
): Promise<ScryfallCard> {
  const { data } = await getCardCollection([
    { set, collector_number: collectorNumber },
  ]);
  const [card] = data;
  if (card === undefined) throw new Error(`No card ${set} ${collectorNumber}`);
  return card;
}

/** Looks the card up through the Scryfall client; rejects when Scryfall finds none. */
function lookUp(reference: CardReference): Promise<ScryfallCard> {
  switch (reference.kind) {
    case "scryfall-id":
      return getCardById(reference.id);
    case "set-number":
      return cardBySetNumber(reference.set, reference.collectorNumber);
    case "name":
      return reference.match === "exact"
        ? getCardByName(reference.name)
        : getCardByNameFuzzy(reference.name);
  }
  const unknown: never = reference;
  return unknown;
}

/** Copies of the named card the deck holds in the zone. */
function copiesIn(deck: Deck, cardName: string, zone: DeckZone): number {
  return cardsFromZoneSource(deck)
    .filter((card) => card.name === cardName && card.zone === zone)
    .reduce((total, card) => total + card.quantity, 0);
}

/** Copies of the named card the open deck holds in the zone, to tell whether an add landed. */
function copiesInZone(cardName: string, zone: DeckZone): number {
  const deck = useDeckStore.getState().getActiveDeck();
  return deck === null ? 0 : copiesIn(deck, cardName, zone);
}

/**
 * Whether the deck already holds as many copies of the card as it may, counted as `addCard`
 * counts them (`copiesCountedFor`): four in a constructed deck and its sideboard together
 * (CR 100.2a, CR 100.4a), one in a singleton deck, its command zone included (CR 903.5b), more
 * when the card's own text or the commander allows it (CR 903.5e). Considering is weighed alone.
 */
function isAtCopyLimit(
  deck: Deck,
  card: ScryfallCard,
  zone: DeckZone
): boolean {
  const limit = deckCopyLimit(
    { name: card.name, typeLine: card.type_line, oracleText: card.oracle_text },
    { format: deck.format, exceptions: commandZoneExceptions(deck) }
  );
  const counted = {
    cards: cardsFromZoneSource(deck),
    commander: deck.commander,
    partner: deck.partner,
  };
  return copiesCountedFor(counted, card.name, zone) >= limit;
}

/**
 * Looks the card up and adds it. A Scryfall printing was chosen by the player, so it is added as
 * an explicit printing; a name takes the add's default (an owned printing first). A card already
 * at its copy limit is reported and not added. The add is reported only when the zone gained a
 * copy: `addCard` reports a failed save itself.
 */
async function addReferencedCard(
  reference: CardReference,
  options: UseExternalCardDropOptions
): Promise<void> {
  const { zone, onOutcome } = options;
  let card: ScryfallCard;
  try {
    card = await lookUp(reference);
  } catch {
    onOutcome({ kind: "lookup-failed" });
    return;
  }
  const deck = useDeckStore.getState().getActiveDeck();
  if (deck !== null && isAtCopyLimit(deck, card, zone)) {
    onOutcome({
      kind: "at-copy-limit",
      cardName: card.name,
      format: deck.format,
    });
    return;
  }
  const before = copiesInZone(card.name, zone);
  const printing = reference.kind === "name" ? undefined : "explicit";
  await useDeckStore.getState().addCard(card, { zone, printing });
  if (copiesInZone(card.name, zone) > before) {
    onOutcome({ kind: "added", cardName: card.name, zone });
  }
}

/**
 * Acts on one payload.
 *
 * @returns whether the payload was taken, so the event's default is to be prevented
 */
function handlePayload(
  payload: DroppedPayload,
  options: UseExternalCardDropOptions
): boolean {
  const reference = readExternalCardReference(payload);
  switch (reference.kind) {
    case "ignored":
      return false;
    case "file":
      options.onOutcome({ kind: "file" });
      return true;
    case "refused":
      options.onOutcome({ kind: "unreadable-link" });
      return true;
    case "scryfall-id":
    case "set-number":
    case "name":
      void addReferencedCard(reference, options);
      return true;
  }
  const unknown: never = reference;
  return unknown;
}

/**
 * Registers the window's drag, drop and paste listeners for the builder.
 *
 * @param options - the zone the editor shows, and the outcome callback; read at event time, so
 *   the listeners are registered once
 * @returns whether an outside drag is over the window
 */
export function useExternalCardDrop(
  options: UseExternalCardDropOptions
): ExternalCardDropState {
  const [isDragOver, setIsDragOver] = useState(false);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    /** Set while a native drag that started in this document is under way. */
    let dragFromInside = false;
    /** Enter and leave events fire for every element crossed; the window is left at zero. */
    let enteredElements = 0;

    const takesDrag = (): boolean => !dragFromInside && !isDialogOpen();
    const endDrag = (): void => {
      enteredElements = 0;
      setIsDragOver(false);
    };

    const onDragStart = (): void => {
      dragFromInside = true;
    };
    const onDragEnd = (): void => {
      dragFromInside = false;
      endDrag();
    };
    const onDragEnter = (): void => {
      if (!takesDrag()) return;
      enteredElements += 1;
      setIsDragOver(true);
    };
    const onDragLeave = (): void => {
      if (enteredElements === 0) return;
      enteredElements -= 1;
      if (enteredElements === 0) setIsDragOver(false);
    };
    const onDragOver = (event: DragEvent): void => {
      if (!takesDrag()) return;
      // Prevented, so the window accepts the drop instead of opening the dragged link.
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };
    const onDrop = (event: DragEvent): void => {
      const taken = takesDrag();
      endDrag();
      if (!taken || !event.dataTransfer) return;
      event.preventDefault();
      handlePayload(payloadOf(event.dataTransfer), latest.current);
    };
    const onPaste = (event: ClipboardEvent): void => {
      if (isDialogOpen() || isTextEntry(event.target) || !event.clipboardData)
        return;
      if (handlePayload(payloadOf(event.clipboardData), latest.current))
        event.preventDefault();
    };

    window.addEventListener("dragstart", onDragStart);
    window.addEventListener("dragend", onDragEnd);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, []);

  return { isDragOver };
}
