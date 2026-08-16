"use client";
// Records how a playtest went — the one thing the app cannot work out itself.
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { SESSION_RESULTS, type SessionResult } from "@/lib/playtest/session-input";
import { logger } from "@/lib/logger";

interface RecordResultBarProps {
  readonly deckId: string;
  readonly turns: number;
  readonly mulliganCount: number;
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
  onRecorded,
}: RecordResultBarProps) {
  const t = useTranslations("playtest");
  const [pending, setPending] = useState<SessionResult | null>(null);
  const [failed, setFailed] = useState(false);

  const record = useCallback(
    async (result: SessionResult) => {
      setPending(result);
      setFailed(false);
      try {
        const response = await fetch(`/api/decks/${deckId}/playtest-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result, turns, mulliganCount }),
        });
        if (!response.ok) throw new Error(`record failed: ${response.status}`);
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
    [deckId, turns, mulliganCount, onRecorded]
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50">{t("recordResult")}</span>
      {SESSION_RESULTS.map((result) => (
        <button
          key={result}
          type="button"
          disabled={pending !== null}
          onClick={() => record(result)}
          className="px-2.5 py-1 rounded text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 transition-colors"
        >
          {pending === result ? t("recording") : t(`result.${result}`)}
        </button>
      ))}
      <button
        type="button"
        onClick={onRecorded}
        className="px-2.5 py-1 rounded text-xs text-white/50 hover:text-white transition-colors"
      >
        {t("skipRecording")}
      </button>
      {failed && <span className="text-xs text-red-400">{t("recordFailed")}</span>}
    </div>
  );
}
