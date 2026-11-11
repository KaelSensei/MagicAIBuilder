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
 * `CardListItem` ignored its `showNotes` prop (since #156).
 *
 * @module card/CardRowActions
 */
import { CardNoteInline } from "@/components/card/CardNoteInline";
import type { DeckCard } from "@/lib/deck/types";

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
