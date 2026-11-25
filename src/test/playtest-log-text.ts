/**
 * The playtest log's lines rendered from the real catalogs, for tests that read the log outside a
 * rendered component: the engine records each line as a message key (#1853), and these helpers
 * say it the way the player reads it, through the same `useLogMessageText` hook the UI uses.
 *
 * Part of the shared test kit. Using the real catalogs means a test breaks when a log key is
 * removed or its wording changes. Call the helpers inside a test: they render the hook, and
 * Testing Library unmounts it after the test.
 *
 * @module test/playtest-log-text
 */
import { useLogMessageText } from "@/hooks/useLogMessageText";
import type { ActionLogTextFormat } from "@/lib/playtest/action-log-export";
import type { PlaytestLogMessage } from "@/lib/playtest/engine";
import { renderHookWithProviders, type TestLocale } from "@/test/render";

/**
 * Renders a log line in `locale` from the `playtest.log.entries` catalog, as the playtest UI does.
 *
 * @param locale - a served locale
 * @returns a function from a recorded message to its sentence
 */
export function logLineIn(
  locale: TestLocale
): (message: PlaytestLogMessage) => string {
  const { result } = renderHookWithProviders(() => useLogMessageText(), {
    locale,
  });
  return result.current;
}

/**
 * The plain English text format the export used before it took the player's words: untranslated
 * step names, "Evidence" and a counted summary, with each line in English. The golden game and
 * the export tests pin their layout with it.
 */
export function plainEnglishLogFormat(): ActionLogTextFormat {
  return {
    title: "playtest log",
    turn: (turn) => `Turn ${turn}`,
    phase: (phase) => phase,
    evidenceTitle: "Evidence",
    evidence: (draws, mana, seen) =>
      `${draws} draws, ${mana} mana, ${seen} additional cards seen`,
    line: logLineIn("en"),
  };
}
