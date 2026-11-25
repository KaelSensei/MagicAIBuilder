"use client";
/**
 * Duplicating a deck, as both "Duplicate" buttons do it: the decks page's
 * deck action and the builder's toolbar button.
 *
 * The deck store copies the deck but cannot speak the player's language, so
 * this hook tells the player: the copy's name on success, and why the copy
 * failed otherwise (I-01).
 *
 * @module hooks/useDeckDuplication
 */
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DECK_DUPLICATE_FAILURE_MESSAGES,
  useDeckFailureReport,
} from "@/hooks/useDeckFailureReport";
import { useToastStore } from "@/hooks/useToast";
import { useDeckStore } from "@/lib/deck/store";

/**
 * Returns the duplicate action: copies the deck, announces the copy by name
 * and opens it in the builder.
 *
 * A failure is logged with its raw error and told in a toast; the player stays
 * where they were. The returned promise never rejects.
 *
 * @returns a function from the deck's id to whether the copy was made
 */
export function useDeckDuplication(): (deckId: string) => Promise<boolean> {
  const t = useTranslations("common");
  const router = useRouter();
  const duplicateDeck = useDeckStore((s) => s.duplicateDeck);
  const addToast = useToastStore((s) => s.add);
  const reportFailure = useDeckFailureReport(DECK_DUPLICATE_FAILURE_MESSAGES);

  return useCallback(
    async (deckId: string) => {
      try {
        const copy = await duplicateDeck(deckId);
        addToast("success", t("deckDuplicate.succeeded", { name: copy.name }));
        router.push(`/builder/${copy.id}`);
        return true;
      } catch (error) {
        reportFailure("duplicateDeck", error);
        return false;
      }
    },
    [addToast, duplicateDeck, reportFailure, router, t]
  );
}
