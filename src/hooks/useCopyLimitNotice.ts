"use client";
/**
 * The builder's notice for an add that stopped at the card's copy limit (I-37): an info toast
 * that names the card and the format and says nothing was added.
 *
 * One notice for every way a card reaches the editor, so the player reads the same sentence
 * whether the card was dropped or pasted from another site, or added from the search panel.
 * The message lives under `builder.externalDrop` because the outside drop was the first add to
 * report it (#1871).
 *
 * @module hooks/useCopyLimitNotice
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useToastStore } from "@/hooks/useToast";
import type { DeckFormat } from "@/lib/deck/formats";

/** Shows the copy-limit notice for the named card in the deck's format. */
export type CopyLimitNotice = (cardName: string, format: DeckFormat) => void;

/**
 * Returns the function that tells the player a card is already at its copy limit for the
 * deck's format, so the add they asked for changed nothing.
 *
 * @returns A stable notice function; it raises one info toast per call
 */
export function useCopyLimitNotice(): CopyLimitNotice {
  const t = useTranslations("builder.externalDrop");
  const formatName = useTranslations("deck.format.name");
  const addToast = useToastStore((state) => state.add);

  return useCallback<CopyLimitNotice>(
    (cardName, format) =>
      addToast(
        "info",
        t("atCopyLimit", { name: cardName, format: formatName(format) })
      ),
    [addToast, t, formatName]
  );
}
