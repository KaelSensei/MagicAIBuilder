"use client";
/**
 * Duplicating a deck, as both "Duplicate" buttons do it: the decks page's
 * deck action and the builder's toolbar button.
 *
 * The deck store copies the deck but cannot speak the player's language, so
 * this hook names the copy in that language, « Atraxa (copie) » (I-04), and
 * tells the player: the copy's name on success, and why the copy failed
 * otherwise (I-01).
 *
 * A deck deleted from another tab or device cannot be copied, and the page
 * that still shows it is out of date. This hook owns that rule; each page
 * says what refreshing means for it.
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
import { copyDeckName } from "@/lib/deck/deck-name";
import { deckRequestFailureOf } from "@/lib/deck/deck-request-failure";
import { useDeckStore } from "@/lib/deck/store";

/** What a page does around a duplicate. */
export interface DeckDuplicationOptions {
  /**
   * Refreshes what the page shows after the server answered that the deck no
   * longer exists. It must not reject. Pass a stable function, as the
   * returned action changes with it.
   */
  readonly onMissing: () => Promise<void>;
}

/**
 * Returns the duplicate action: copies the deck under a name in the player's
 * language, announces the copy by name and opens it in the builder.
 *
 * The copy's name is worded from the deck's name as the store holds it, and
 * fitted to the deck-name limit (`copyDeckName`). A deck the store does not
 * hold is copied without a name, so the server names it.
 *
 * A failure is logged with its raw error and told in a toast; the player stays
 * where they were. When the deck no longer exists, the page is also refreshed
 * through `onMissing`, so it stops offering the deck. The returned promise
 * never rejects.
 *
 * @param options - what the page does when the deck no longer exists
 * @returns a function from the deck's id to whether the copy was made
 */
export function useDeckDuplication({
  onMissing,
}: DeckDuplicationOptions): (deckId: string) => Promise<boolean> {
  const t = useTranslations("common");
  const router = useRouter();
  const duplicateDeck = useDeckStore((s) => s.duplicateDeck);
  const addToast = useToastStore((s) => s.add);
  const reportFailure = useDeckFailureReport(DECK_DUPLICATE_FAILURE_MESSAGES);

  return useCallback(
    async (deckId: string) => {
      const deckName = useDeckStore.getState().decks[deckId]?.name;
      const copyName =
        deckName === undefined
          ? undefined
          : copyDeckName(deckName, (name) =>
              t("deckDuplicate.copyName", { name })
            );
      try {
        const copy = await duplicateDeck(deckId, copyName);
        addToast("success", t("deckDuplicate.succeeded", { name: copy.name }));
        router.push(`/builder/${copy.id}`);
        return true;
      } catch (error) {
        reportFailure("duplicateDeck", error);
        if (deckRequestFailureOf(error) === "missing") void onMissing();
        return false;
      }
    },
    [addToast, duplicateDeck, onMissing, reportFailure, router, t]
  );
}
