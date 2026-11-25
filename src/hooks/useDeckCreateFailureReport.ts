"use client";
/**
 * The one report of a failed deck creation, shared by the decks page's
 * "New deck" button and the header's deck actions so both say the same thing.
 *
 * @module hooks/useDeckCreateFailureReport
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useToastStore } from "@/hooks/useToast";
import {
  deckCreateFailureOf,
  type DeckCreateFailure,
} from "@/lib/deck/deck-create-failure";
import { logger } from "@/lib/logger";

/** The `common` catalog key each failure is told with. */
const FAILURE_MESSAGE_KEYS: Readonly<Record<DeckCreateFailure, string>> = {
  "signed-out": "nav.createSignedOut",
  failed: "nav.createFailed",
};

/**
 * Logs a failed deck creation and tells the player in a toast, in their
 * language.
 *
 * Logging alone made the button look inert: it spun, the request failed, and
 * the player was left with no explanation. The toast never carries the thrown
 * message, which is diagnostic text; the log keeps it (I-01).
 *
 * @returns a function from the failed operation's name, for the log, and what
 *   it threw, to nothing
 */
export function useDeckCreateFailureReport(): (
  operation: string,
  error: unknown
) => void {
  const t = useTranslations("common");
  const addToast = useToastStore((s) => s.add);

  return useCallback(
    (operation: string, error: unknown) => {
      logger.error("Unexpected error", operation, error);
      addToast("error", t(FAILURE_MESSAGE_KEYS[deckCreateFailureOf(error)]));
    },
    [addToast, t]
  );
}
