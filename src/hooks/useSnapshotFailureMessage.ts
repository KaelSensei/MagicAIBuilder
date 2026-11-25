"use client";
/**
 * The one way the deck History panel tells a failed snapshot action: the raw
 * error goes to the log, and the player reads a sentence in their language.
 *
 * @module hooks/useSnapshotFailureMessage
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { isSignedOutRefusal } from "@/lib/db/deck-api-answer";
import { logger } from "@/lib/logger";

/** The History panel's four actions on the server. */
export type SnapshotAction = "load" | "save" | "delete" | "restore";

/** The `deck.snapshots` catalog key that says each action failed. */
const FAILED_MESSAGE_KEYS: Readonly<Record<SnapshotAction, string>> = {
  load: "loadFailed",
  save: "saveFailed",
  delete: "deleteFailed",
  restore: "restoreFailed",
};

/** The client function each action calls, named in the log. */
const LOG_CONTEXTS: Readonly<Record<SnapshotAction, string>> = {
  load: "SnapshotsPanel.listSnapshots",
  save: "SnapshotsPanel.createSnapshot",
  delete: "SnapshotsPanel.deleteSnapshot",
  restore: "SnapshotsPanel.restoreSnapshot",
};

/**
 * Logs a failed snapshot action once and returns what the player reads.
 *
 * The thrown message is diagnostic text (`[createSnapshot] HTTP 500: …`,
 * "Failed to fetch") and never reaches the player (I-01). The route checks the
 * name the client has already checked, so a 400 is a client bug and reads as
 * any other failure; a 401 means the session ended, where trying again cannot
 * help, so it asks the player to sign in again.
 *
 * @returns a function from the failed action and what it threw to the
 *   sentence to show, in the player's language
 */
export function useSnapshotFailureMessage(): (
  action: SnapshotAction,
  error: unknown
) => string {
  const t = useTranslations("deck.snapshots");

  return useCallback(
    (action: SnapshotAction, error: unknown) => {
      logger.error("Snapshot action failed", LOG_CONTEXTS[action], error);
      return t(
        isSignedOutRefusal(error) ? "signedOut" : FAILED_MESSAGE_KEYS[action]
      );
    },
    [t]
  );
}
