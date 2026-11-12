/**
 * The one request a command-zone edit sends, built from the slots it touches.
 *
 * Deck-building context, browser side. The deck store plans a commander,
 * partner or companion change here and sends it with `changeCommandZone`
 * (`src/lib/db/deck-api.ts`); the server stores every row and field of it in
 * one transaction. Each touched slot is cleared by role and refilled when it
 * gets a card, so a stray row an earlier pick left behind leaves too. The
 * pairing rules the store applies before planning live in `pairing.ts`
 * (CR 702.124); this module only shapes the request and reads the answer.
 *
 * @module deck/command-zone-change
 */
import type { ApiDeckCard, CommandZoneChangeRequest } from "@/lib/db/deck-api";

import type { CommandSlot, CommandZonePatch } from "./bulk-edit-command-zone";
import { commandCardPayload } from "./store-factories";
import type { DeckCard } from "./types";

/** How an edit leaves one slot: the card that fills it afterwards, or null to empty it. */
export interface CommandSlotEdit {
  readonly slot: CommandSlot;
  readonly card: DeckCard | null;
}

/** A command-zone edit as the store plans it. */
export interface CommandZoneEdit {
  /** The slots the edit touches; a slot it does not name keeps its row. */
  readonly slots: readonly CommandSlotEdit[];
  /** The deck fields the edit writes; an absent key keeps the stored value. */
  readonly fields: Partial<CommandZonePatch>;
  /** Main-deck rows that leave with the edit: the row of a promoted card. */
  readonly removeCardIds?: readonly string[];
}

/**
 * Builds the request for an edit: every touched slot is cleared, and the
 * slots that get a card are refilled with one command-zone row each.
 *
 * @param edit - the planned edit
 * @returns the body of `PATCH /api/decks/[id]/command-zone`
 */
export function commandZoneRequest(
  edit: CommandZoneEdit
): CommandZoneChangeRequest {
  return {
    removeCardIds: edit.removeCardIds ?? [],
    clearCommandSlots: edit.slots.map((slotEdit) => slotEdit.slot),
    addCards: edit.slots.flatMap((slotEdit) =>
      slotEdit.card ? [commandCardPayload(slotEdit.card, slotEdit.slot)] : []
    ),
    commandZone: edit.fields,
  };
}

/**
 * The saved row of each slot a change filled, read from the rows the server
 * answered by the same role flags the deck loader uses.
 *
 * @param cards - the rows the change added
 * @returns the row per filled slot
 */
export function savedRowsBySlot(
  cards: readonly ApiDeckCard[]
): Partial<Record<CommandSlot, ApiDeckCard>> {
  const rows: Partial<Record<CommandSlot, ApiDeckCard>> = {};
  for (const row of cards) {
    if (row.isPartner) rows.partner = row;
    else if (row.isCommander) rows.commander = row;
    else if (row.category === "companion") rows.companion = row;
  }
  return rows;
}
