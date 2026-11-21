"use client";
/**
 * The zoom's "Add to <deck>" button, with the open deck's count of the card beside it, or a
 * one-line hint when no deck is open.
 *
 * Rules reference context, `ui/`. Presentational: it renders the `OpenDeckAddition` the page
 * reads through `useAddToOpenDeck` and calls its `onAdd`; it never reads the deck store. The deck
 * name is text, not part of an image, so a screen reader and a translation read it.
 *
 * @module rules-reference/ui/AddToOpenDeckButton
 */
import { useTranslations } from "next-intl";
import type { OpenDeckAddition } from "@/modules/rules-reference/client/useAddToOpenDeck";

/** What the button shows and does. */
export interface AddToOpenDeckButtonProps {
  readonly addition: OpenDeckAddition;
}

/**
 * The add button and the count of the zoomed card in the open deck, or the hint to open a deck.
 *
 * The button reads "Added to <deck>" only while the last press raised the deck's count; it is
 * disabled while that press saves, so a double press cannot send two adds.
 */
export function AddToOpenDeckButton({ addition }: AddToOpenDeckButtonProps) {
  const t = useTranslations("rules");

  if (addition.kind === "no-open-deck") {
    return (
      <p className="mt-2 text-xs text-white/60">{t("zoom.openDeckHint")}</p>
    );
  }

  const { deckName, copies, showCount, justAdded, isAdding, onAdd } = addition;
  const countKey = showCount ? "zoom.copiesInDeck" : "zoom.inDeck";
  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onAdd}
        disabled={isAdding}
        aria-busy={isAdding}
        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {t(justAdded ? "zoom.addedToDeck" : "zoom.addToDeck", {
          deck: deckName,
        })}
      </button>
      <output className="text-xs text-white/70">
        {copies > 0 && t(countKey, { count: copies, deck: deckName })}
      </output>
    </div>
  );
}
