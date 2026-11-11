// Keeps the deck rows behind the command zone in step with what it shows.
//
// `Deck.commanderId` and `Deck.partnerId` hold Scryfall printing ids: the
// pairing checks look them up on Scryfall, and forks copy them unchanged.
// Every reader of the command zone, though, finds the commander and partner by
// the `isCommander` / `isPartner` flags on deck rows. So the store must address
// a command-zone card by its row id, and a change must delete the rows of the
// cards it takes off screen, or they come back on the next load.
//
// @module deck/command-zone-rows
import * as deckApi from "@/lib/db/deck-api";
import { logger } from "@/lib/logger";

import type { Deck, DeckCard } from "./types";

/** A command-zone slot whose card is saved as its own deck row. */
export type CommandSlot = "commander" | "partner";

/** The row the server saved for a card placed in a command-zone slot. */
export interface SavedCommandRow {
  readonly deckId: string;
  readonly slot: CommandSlot;
  /** Id the card was placed with: its Scryfall printing id. */
  readonly placedId: string;
  /** Id of the deck row the server created for it. */
  readonly rowId: string;
}

/**
 * Gives a placed command-zone card the id of the row saved for it.
 *
 * Row operations address a card by its row id, so the printing id the card was
 * placed with must not outlive the save. A card replaced while the save was
 * pending is left alone.
 *
 * @param decks - Decks held in the store
 * @param saved - The row saved for the placed card
 * @returns The decks with the card's row id, or `decks` itself when the card is no longer on screen
 */
export function withSavedCommandRow(
  decks: Readonly<Record<string, Deck>>,
  saved: SavedCommandRow
): Readonly<Record<string, Deck>> {
  const deck = decks[saved.deckId];
  const card = deck?.[saved.slot];
  if (!deck || !card || card.id !== saved.placedId) return decks;
  const withRowId: DeckCard = { ...card, id: saved.rowId };
  const updated: Deck =
    saved.slot === "commander"
      ? { ...deck, commander: withRowId }
      : { ...deck, partner: withRowId };
  return { ...decks, [saved.deckId]: updated };
}

/**
 * Deletes the rows of the command-zone cards a change took off screen.
 *
 * Call it once the deck record names the new command zone. A row that cannot be
 * deleted is logged and left in place: the deck record is already saved, and
 * the commander rollback only covers a deck record that failed.
 *
 * The deletes run at once. Their order does not matter: each names a
 * different row, sends no expected version, and is its own server
 * transaction (`DELETE /api/decks/[id]/cards/[cardId]`).
 *
 * @param deckId - Deck the change was made on
 * @param previous - Commander and partner on screen before the change
 * @param next - Commander and partner the change put on screen
 * @returns Resolves once every replaced row was deleted or logged; never rejects
 */
export async function removeReplacedCommandRows(
  deckId: string,
  previous: readonly (DeckCard | null)[],
  next: readonly (DeckCard | null)[]
): Promise<void> {
  const kept = new Set(next.map((card) => card?.id));
  const replaced = previous.filter(
    (card): card is DeckCard => card !== null && !kept.has(card.id)
  );
  await Promise.all(replaced.map((card) => removeRowOrLog(deckId, card.id)));
}

/**
 * Deletes one command-zone row, logging a failure instead of rejecting.
 *
 * @param deckId - Deck that holds the row
 * @param rowId - Id of the row to delete
 * @returns Resolves once the row was deleted or the failure logged
 */
async function removeRowOrLog(deckId: string, rowId: string): Promise<void> {
  try {
    await deckApi.removeCard(deckId, rowId);
  } catch (err) {
    logger.error(
      "Could not remove a replaced command-zone row",
      "removeReplacedCommandRows",
      err
    );
  }
}
