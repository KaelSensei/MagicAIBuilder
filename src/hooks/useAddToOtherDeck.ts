"use client";
/**
 * The state of "Add to another deck…" from a deck row (I-37): what the deck
 * picker shows while one copy of the row's card goes to another of the
 * player's decks, and the message once it is stored.
 *
 * Deck-building context, client hook. The write itself is
 * `addCardToOtherDeck`; this hook turns its outcome into the picker's state
 * and the success toast. The open deck is never written.
 *
 * @module hooks/useAddToOtherDeck
 */
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useToastStore } from "@/hooks/useToast";
import { addCardToOtherDeck } from "@/lib/deck/add-to-other-deck-write";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard, DeckZone } from "@/lib/deck/types";
import { logger } from "@/lib/logger";

/** A deck the player picked to receive the card. */
export interface OtherDeckChoice {
  readonly id: string;
  readonly name: string;
}

/** Where the picker stands with the add. */
export type AddToOtherDeckStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "saving" }
  /** Nothing was written: the deck already holds the most copies allowed. */
  | { readonly kind: "atLimit"; readonly deckName: string }
  /** A read or a write failed; the same add can be tried again. */
  | {
      readonly kind: "failed";
      readonly deck: OtherDeckChoice;
      readonly zone: DeckZone;
    };

/** The `builder` catalogue key that names each zone on screen. */
export const ZONE_LABEL_KEYS: Readonly<Record<DeckZone, string>> = {
  main: "zones.main",
  sideboard: "zones.sideboard",
  maybeboard: "zones.considering",
};

/**
 * Adds one copy of a deck row's card to another of the player's decks.
 *
 * @param card - the open deck's row; its printing is the one added
 * @returns the picker's status, and `addTo`, which resolves `true` once the
 *   copy is stored and the success message is shown, `false` otherwise
 */
export function useAddToOtherDeck(card: DeckCard) {
  const t = useTranslations("builder");
  const reloadDeckOnNextOpen = useDeckStore((s) => s.reloadDeckOnNextOpen);
  const [status, setStatus] = useState<AddToOtherDeckStatus>({ kind: "idle" });

  const addTo = useCallback(
    async (deck: OtherDeckChoice, zone: DeckZone): Promise<boolean> => {
      setStatus({ kind: "saving" });
      try {
        const outcome = await addCardToOtherDeck({
          card,
          deckId: deck.id,
          zone,
        });
        if (outcome.kind === "atLimit") {
          setStatus({ kind: "atLimit", deckName: deck.name });
          return false;
        }
        // The store may hold the other deck's rows from an earlier open; they
        // no longer match the server's, so the next open reads it again.
        reloadDeckOnNextOpen(deck.id);
        useToastStore.getState().add(
          "success",
          t("rowAddElsewhere.addedToDeck", {
            name: card.name,
            deck: deck.name,
            zone: t(ZONE_LABEL_KEYS[zone]),
          })
        );
        setStatus({ kind: "idle" });
        return true;
      } catch (error) {
        logger.error("Unexpected error", "useAddToOtherDeck", error);
        setStatus({ kind: "failed", deck, zone });
        return false;
      }
    },
    [card, reloadDeckOnNextOpen, t]
  );

  return { status, addTo };
}
