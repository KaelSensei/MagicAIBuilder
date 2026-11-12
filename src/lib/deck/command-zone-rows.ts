/**
 * Keeps the deck rows behind the command zone in step with what it shows.
 *
 * `Deck.commanderId` and `Deck.partnerId` hold Scryfall printing ids: the
 * pairing checks look them up on Scryfall, and forks copy them unchanged.
 * Every reader of the command zone, though, finds the commander and partner by
 * the `isCommander` / `isPartner` flags on deck rows. So the store addresses a
 * command-zone card by its row id once the row is saved. The rows a change
 * takes off screen are removed by the server in the same request that saves
 * the change (`PATCH /api/decks/[id]/command-zone`), not by this module.
 *
 * @module deck/command-zone-rows
 */
import type { ApiDeckCard } from "@/lib/db/deck-api";

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
  if (!deck || card?.id !== saved.placedId) return decks;
  const withRowId: DeckCard = { ...card, id: saved.rowId };
  const updated: Deck =
    saved.slot === "commander"
      ? { ...deck, commander: withRowId }
      : { ...deck, partner: withRowId };
  return { ...decks, [saved.deckId]: updated };
}

/**
 * Gives the commander and partner the ids of the rows one command-zone save
 * answered. A row is matched to its slot by its role flags, and to the card on
 * screen by the printing id the card was placed with, through
 * {@link withSavedCommandRow}; the companion is set by its caller instead,
 * since it is shown only once saved.
 *
 * @param decks - Decks held in the store
 * @param deckId - Deck the change was made on
 * @param rows - The rows the save added
 * @returns The decks with the saved row ids in place
 */
export function withSavedCommandRows(
  decks: Readonly<Record<string, Deck>>,
  deckId: string,
  rows: readonly ApiDeckCard[]
): Readonly<Record<string, Deck>> {
  return rows.reduce((current, row) => {
    if (!row.isCommander) return current;
    return withSavedCommandRow(current, {
      deckId,
      slot: row.isPartner ? "partner" : "commander",
      placedId: row.scryfallId,
      rowId: row.id,
    });
  }, decks);
}
