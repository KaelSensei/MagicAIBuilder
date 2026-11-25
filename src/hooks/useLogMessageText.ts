"use client";
/**
 * The playtest log's lines in the player's language: binds `logMessageText` to next-intl's
 * `playtest.log.entries` catalog of the current locale (#1853).
 *
 * Playtest context, client state. `ActionLogEntryRow` shows and edits a line through it and
 * `ActionLogHeader` copies and exports the log through it, so every place a line appears says
 * the same thing.
 *
 * @module hooks/useLogMessageText
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { PlaytestLogMessage } from "@/lib/playtest/engine";
import { logMessageText } from "@/lib/playtest/action-log-text";

/**
 * A function that turns one recorded log line into its sentence in the current locale. Stable
 * while the locale is, so a memoised consumer does not recompute on every render.
 */
export function useLogMessageText(): (message: PlaytestLogMessage) => string {
  const t = useTranslations("playtest.log.entries");
  return useCallback(
    (message: PlaytestLogMessage) =>
      logMessageText(message, (key, values) => t(key, values)),
    [t]
  );
}
