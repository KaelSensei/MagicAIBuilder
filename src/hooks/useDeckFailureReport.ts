"use client";
/**
 * The one report of a failed deck request, shared by every button that sends
 * it so they all say the same thing. Each request names the `common` catalog
 * key of each failure; the reading of the failure is shared.
 *
 * @module hooks/useDeckFailureReport
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useToastStore } from "@/hooks/useToast";
import {
  deckRequestFailureOf,
  type DeckRequestFailure,
} from "@/lib/deck/deck-request-failure";
import { logger } from "@/lib/logger";

/** The `common` catalog key each failure of one request is told with. */
export type DeckFailureMessages = Readonly<Record<DeckRequestFailure, string>>;

/** How a failed creation of an empty deck reads: the decks page's and the header's "New deck". */
export const DECK_CREATE_FAILURE_MESSAGES: DeckFailureMessages = {
  "signed-out": "nav.createSignedOut",
  failed: "nav.createFailed",
};

/**
 * Logs a failed deck request and tells the player in a toast, in their
 * language.
 *
 * Logging alone made the button look inert: it spun, the request failed, and
 * the player was left with no explanation. The toast never carries the thrown
 * message, which is diagnostic text; the log keeps it (I-01).
 *
 * @param messages - the request's catalog keys; a module constant, so the
 *   returned function stays the same between renders
 * @returns a function from the failed operation's name, for the log, and what
 *   it threw, to nothing
 */
export function useDeckFailureReport(
  messages: DeckFailureMessages
): (operation: string, error: unknown) => void {
  const t = useTranslations("common");
  const addToast = useToastStore((s) => s.add);

  return useCallback(
    (operation: string, error: unknown) => {
      logger.error("Unexpected error", operation, error);
      addToast("error", t(messages[deckRequestFailureOf(error)]));
    },
    [addToast, messages, t]
  );
}

/**
 * The report of a failed deck creation, shared by the decks page's "New deck"
 * button and the header's deck actions.
 *
 * @returns the report, as {@link useDeckFailureReport} returns it
 */
export function useDeckCreateFailureReport(): (
  operation: string,
  error: unknown
) => void {
  return useDeckFailureReport(DECK_CREATE_FAILURE_MESSAGES);
}
