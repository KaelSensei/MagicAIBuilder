"use client";
/**
 * Deleting a deck from the decks page, as the player is told about it.
 *
 * The deck store deletes the deck but cannot speak the player's language, so
 * this hook tells the player: that the deck was already gone when the server
 * no longer had it, and why the delete failed otherwise (I-01).
 *
 * @module hooks/useDeckDeletion
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  useDeckFailureReport,
  type DeckFailureMessages,
} from "@/hooks/useDeckFailureReport";
import { useToastStore } from "@/hooks/useToast";
import { useDeckStore } from "@/lib/deck/store";

/**
 * How a failed delete reads. The store counts a 404 as a deck already
 * deleted (`deleteOnServer`), so `missing` never reaches the report; it reads
 * as any other failure.
 */
export const DECK_DELETE_FAILURE_MESSAGES: DeckFailureMessages = {
  "signed-out": "deckDelete.signedOut",
  missing: "deckDelete.failed",
  failed: "deckDelete.failed",
};

/**
 * Returns the delete action: deletes the deck, already confirmed by the
 * player.
 *
 * A deck the server no longer had leaves the library too, with an
 * informational toast. A failure is logged with its raw error and told in a
 * toast; the deck stays. The returned promise never rejects.
 *
 * @returns a function from the deck's id to whether the deck left the library
 */
export function useDeckDeletion(): (deckId: string) => Promise<boolean> {
  const t = useTranslations("common");
  const deleteDeck = useDeckStore((s) => s.deleteDeck);
  const addToast = useToastStore((s) => s.add);
  const reportFailure = useDeckFailureReport(DECK_DELETE_FAILURE_MESSAGES);

  return useCallback(
    async (deckId: string) => {
      try {
        const deletion = await deleteDeck(deckId);
        if (deletion === "alreadyDeleted") {
          addToast("info", t("deckDelete.alreadyDeleted"));
        }
        return true;
      } catch (error) {
        reportFailure("deleteDeck", error);
        return false;
      }
    },
    [addToast, deleteDeck, reportFailure, t]
  );
}
