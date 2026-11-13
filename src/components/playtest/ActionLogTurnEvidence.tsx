"use client";
/**
 * The turn evidence box of the playtest action log: per turn, the draws, the
 * mana produced and the cards seen that the structured entries recorded.
 *
 * Playtest context, UI. Presentational: `useActionLogFilter` picks the
 * summaries (the selected turn, with evidence only); this file renders them
 * and says that free-form notes are not counted. Nothing is rendered without
 * a summary.
 *
 * @module playtest/ActionLogTurnEvidence
 */
import { useTranslations } from "next-intl";
import type { PlaytestTurnSummary } from "@/lib/playtest/action-log-export";

/** The turn summaries to show, already filtered to those with evidence. */
export interface ActionLogTurnEvidenceProps {
  readonly summaries: readonly PlaytestTurnSummary[];
}

/** The box, labelled "Turn evidence" for assistive technology; null when there is nothing to show. */
export function ActionLogTurnEvidence({
  summaries,
}: ActionLogTurnEvidenceProps) {
  const t = useTranslations("playtest.log");
  if (summaries.length === 0) return null;

  return (
    <div
      className="mb-3 space-y-1 rounded-md border border-[var(--border)] bg-[var(--background)] p-2"
      aria-label={t("evidenceTitle")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {t("evidenceTitle")}
      </p>
      {summaries.map((summary) => (
        <p key={summary.turn} className="text-xs text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">
            {t("turn", { turn: summary.turn })}
          </span>{" "}
          ·{" "}
          {t("evidence", {
            draws: summary.draws,
            mana: summary.manaProduced,
            seen: summary.cardsSeen,
          })}
        </p>
      ))}
      <p className="text-[10px] text-[var(--text-secondary)]">
        {t("evidenceLimit")}
      </p>
    </div>
  );
}
