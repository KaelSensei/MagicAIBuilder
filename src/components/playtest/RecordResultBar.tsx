"use client";
// Records how a playtest went — the one thing the app cannot work out itself.
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import {
  MAX_SESSION_NOTES_LENGTH,
  MAX_PROPOSED_CHANGE_LENGTH,
  SESSION_DIFFICULTIES,
  SESSION_RESULTS,
  type SessionDifficulty,
  type SessionResult,
} from "@/lib/playtest/session-input";
import { logger } from "@/lib/logger";

interface RecordResultBarProps {
  readonly deckId: string;
  readonly turns: number;
  readonly mulliganCount: number;
  readonly cardsSeen: number;
  readonly additionalCardsSeen: number;
  /** Called once the session is stored, or immediately if the player skips */
  readonly onRecorded: () => void;
}

/**
 * The win / loss / draw bar shown during a playtest.
 *
 * The playtest is a solitaire goldfish with no opponent, so nothing in the app
 * can decide whether a run was a win — the player has to say. Skipping is a
 * first-class option: a run abandoned halfway is not a loss, and recording it
 * as one would poison the win rate it feeds.
 */
export function RecordResultBar({
  deckId,
  turns,
  mulliganCount,
  cardsSeen,
  additionalCardsSeen,
  onRecorded,
}: RecordResultBarProps) {
  const t = useTranslations("playtest");
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<SessionResult | null>(null);
  const [failed, setFailed] = useState(false);
  // Empty means "not saying", which is a legitimate answer — the column is
  // nullable and the matchup breakdown simply skips those runs.
  const [difficulty, setDifficulty] = useState<SessionDifficulty | "">("");
  const [notes, setNotes] = useState("");
  const [proposedChange, setProposedChange] = useState("");

  const record = useCallback(
    async (result: SessionResult) => {
      setPending(result);
      setFailed(false);
      try {
        const response = await fetch(`/api/decks/${deckId}/playtest-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Omit the key entirely rather than sending "", which fails
          // validation; absent is what "not saying" means to the route.
          body: JSON.stringify({
            result,
            turns,
            mulliganCount,
            cardsSeen,
            additionalCardsSeen,
            ...(difficulty === "" ? {} : { difficulty }),
            ...(notes.trim() === "" ? {} : { notes: notes.trim() }),
            ...(proposedChange.trim() === ""
              ? {}
              : { proposedChange: proposedChange.trim() }),
          }),
        });
        if (!response.ok) throw new Error(`record failed: ${response.status}`);
        // The history panel is cached; without this the run just recorded
        // would be missing from it the next time the modal opens.
        await queryClient.invalidateQueries({ queryKey: ["playtest", "history", deckId] });
        onRecorded();
      } catch (error) {
        // Keep the modal open: closing would discard a result the player just
        // gave us, with nothing stored to show for it.
        logger.error("Failed to record playtest session", "RecordResultBar", error);
        setFailed(true);
      } finally {
        setPending(null);
      }
    },
    [
      deckId,
      turns,
      mulliganCount,
      cardsSeen,
      additionalCardsSeen,
      difficulty,
      notes,
      proposedChange,
      onRecorded,
      queryClient,
    ]
  );

  return (
    <div
      data-testid="playtest-result-bar"
      className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <span className="text-xs text-[var(--text-secondary)]">{t("recordResult")}</span>
      <label className="sr-only" htmlFor="playtest-difficulty">
        {t("difficultyLabel")}
      </label>
      <select
        id="playtest-difficulty"
        value={difficulty}
        onChange={(event) => {
          const selectedDifficulty =
            SESSION_DIFFICULTIES.find((value) => value === event.target.value) ?? "";
          setDifficulty(selectedDifficulty);
        }}
        className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-primary)] sm:w-auto"
      >
        <option value="">{t("difficultyUnset")}</option>
        {SESSION_DIFFICULTIES.map((value) => (
          <option key={value} value={value}>
            {t(`difficulty.${value}`)}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="playtest-notes">
        {t("notesLabel")}
      </label>
      <input
        id="playtest-notes"
        type="text"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={MAX_SESSION_NOTES_LENGTH}
        placeholder={t("notesPlaceholder")}
        className="w-full min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] sm:min-w-48"
      />
      <label className="sr-only" htmlFor="playtest-proposed-change">
        {t("proposedChangeLabel")}
      </label>
      <input
        id="playtest-proposed-change"
        type="text"
        value={proposedChange}
        onChange={(event) => setProposedChange(event.target.value)}
        maxLength={MAX_PROPOSED_CHANGE_LENGTH}
        placeholder={t("proposedChangePlaceholder")}
        className="w-full min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] sm:min-w-48"
      />
      {SESSION_RESULTS.map((result) => (
        <button
          key={result}
          type="button"
          disabled={pending !== null}
          onClick={() => record(result)}
          className="px-2.5 py-1 rounded text-xs font-medium bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"
        >
          {pending === result ? t("recording") : t(`result.${result}`)}
        </button>
      ))}
      <button
        type="button"
        onClick={onRecorded}
        className="px-2.5 py-1 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        {t("skipRecording")}
      </button>
      {failed && <span className="text-xs text-red-400">{t("recordFailed")}</span>}
    </div>
  );
}
