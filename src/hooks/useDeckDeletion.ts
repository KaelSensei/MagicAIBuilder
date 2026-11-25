"use client";
/**
 * Deleting a deck from the decks page, as the player is told about it.
 *
 * The deck store deletes the deck but cannot speak the player's language, so
 * this hook tells the player why a delete failed (I-01).
 *
 * @module hooks/useDeckDeletion
 */
import { useCallback } from "react";
import {
  useDeckFailureReport,
  type DeckFailureMessages,
} from "@/hooks/useDeckFailureReport";
import { useDeckStore } from "@/lib/deck/store";

/** How a failed delete reads. */
export const DECK_DELETE_FAILURE_MESSAGES: DeckFailureMessages = {
  "signed-out": "deckDelete.signedOut",
  missing: "deckDelete.failed",
  failed: "deckDelete.failed",
};

/**
 * Returns the delete action: deletes the deck, already confirmed by the
 * player.
 *
 * A failure is logged with its raw error and told in a toast; the deck stays.
 * The returned promise never rejects.
 *
 * @returns a function from the deck's id to whether the deck left the library
 */
export function useDeckDeletion(): (deckId: string) => Promise<boolean> {
  const deleteDeck = useDeckStore((s) => s.deleteDeck);
  const reportFailure = useDeckFailureReport(DECK_DELETE_FAILURE_MESSAGES);

  return useCallback(
    async (deckId: string) => {
      try {
        await deleteDeck(deckId);
        return true;
      } catch (error) {
        reportFailure("deleteDeck", error);
        return false;
      }
    },
    [deleteDeck, reportFailure]
  );
}
