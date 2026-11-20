"use client";
/**
 * The body of the `/stats` page: the year picker and one year of the
 * signed-in player's statistics (I-60 slice 2, requirement 2.1).
 *
 * The page renders the current year on the server and hands it over; another
 * year, or a retry after a failed load, is read from `GET /api/user/stats`
 * through `usePlayerStats`. A failed load shows a catalogue message and a
 * retry, never the status code.
 *
 * @module components/stats/PlayerStatsView
 */
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import type { PlayerStatsReport } from "@/lib/deck/player-stats-report";
import { PlayerStatsSections } from "./PlayerStatsSections";

/** What the page hands over. */
export interface PlayerStatsViewProps {
  /** The current year's report read on the server, or null when that read failed */
  readonly initialReport: PlayerStatsReport | null;
  /** The year shown first: the current one */
  readonly initialYear: number;
}

/** The year picker and the chosen year's statistics. */
export function PlayerStatsView({
  initialReport,
  initialYear,
}: PlayerStatsViewProps) {
  const t = useTranslations("stats");
  const pickerId = useId();
  const [year, setYear] = useState(initialYear);
  const query = usePlayerStats(year, initialReport);
  const years = query.data?.years ?? initialReport?.years ?? [year];

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-text)]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{t("title", { year })}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor={pickerId}>{t("yearLabel")}</label>
          <select
            id={pickerId}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </header>
      {query.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
          <span>{t("loadFailed")}</span>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="rounded border border-[var(--border)] px-3 py-1 hover:border-[var(--accent)]"
          >
            {t("retry")}
          </button>
        </div>
      )}
      {query.isPending && (
        <output className="block text-sm text-[var(--text-secondary)]">
          {t("loading")}
        </output>
      )}
      {query.isSuccess && <PlayerStatsSections report={query.data} />}
    </>
  );
}
