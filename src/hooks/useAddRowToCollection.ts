"use client";
/**
 * "Add to my collection" from a deck row (I-37): one copy of the row's
 * printing, through the collection store's own `addToCollection`, with the
 * fields the search results' quick add sends (`QuickAddCollectionButton`).
 *
 * Collection context, client hook. The store logs a failed save and keeps the
 * collection as it was, without telling its caller; the hook tells by the
 * printing's row: only a saved add puts a new row object there.
 *
 * @module hooks/useAddRowToCollection
 */
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useToastStore } from "@/hooks/useToast";
import { useCollectionStore } from "@/lib/collection/store";
import type { DeckCard } from "@/lib/deck/types";

/**
 * Adds one copy of a deck row's printing to the player's collection.
 *
 * @param card - the deck row; `scryfallId` names its printing
 * @returns `add`, which saves the copy and shows the outcome, and `failed`,
 *   true while the last add has not been saved, so the row offers a retry
 */
export function useAddRowToCollection(card: DeckCard) {
  const t = useTranslations("builder.rowAddElsewhere");
  const addToCollection = useCollectionStore((s) => s.addToCollection);
  const [failed, setFailed] = useState(false);

  const add = useCallback(async () => {
    const scryfallId = card.scryfallId ?? card.id;
    const heldRow = () =>
      useCollectionStore.getState().collectionCards[scryfallId];
    const before = heldRow();
    await addToCollection({
      scryfallId,
      name: card.name,
      quantity: 1,
      price: card.price,
      imageUri: card.imageUri,
    });
    const saved = heldRow() !== undefined && heldRow() !== before;
    setFailed(!saved);
    const toast = useToastStore.getState();
    if (saved) {
      toast.add("success", t("addedToCollection", { name: card.name }));
    } else {
      toast.add("error", t("collectionFailed", { name: card.name }));
    }
  }, [addToCollection, card, t]);

  return { add, failed };
}
