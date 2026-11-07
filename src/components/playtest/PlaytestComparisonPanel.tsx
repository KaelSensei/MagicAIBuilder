"use client";

import { GitCompareArrows } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { PlaytestSession } from "@/lib/playtest/analytics";
import { compareSessionGroups } from "@/lib/playtest/comparison";

interface PlaytestComparisonPanelProps {
  readonly sessions: readonly PlaytestSession[];
}

interface SnapshotCohort {
  readonly id: string;
  readonly date: Date;
  readonly sessions: readonly PlaytestSession[];
}

const MIN_CONFIDENT_COHORT_SIZE = 3;

function buildCohorts(
  sessions: readonly PlaytestSession[]
): readonly SnapshotCohort[] {
  const groups = new Map<string, PlaytestSession[]>();
  for (const session of sessions) {
    if (!session.snapshotId) continue;
    const cohort = groups.get(session.snapshotId) ?? [];
    cohort.push(session);
    groups.set(session.snapshotId, cohort);
  }

  return [...groups.entries()]
    .map(([id, cohortSessions]) => ({
      id,
      date: new Date(
        Math.min(
          ...cohortSessions.map((session) => session.createdAt.getTime())
        )
      ),
      sessions: cohortSessions,
    }))
    .sort((left, right) => left.date.getTime() - right.date.getTime());
}

/** Compare the evidence recorded against two saved deck versions. */
export function PlaytestComparisonPanel({
  sessions,
}: PlaytestComparisonPanelProps) {
  const t = useTranslations("playtest.comparison");
  const format = useFormatter();
  const cohorts = useMemo(() => buildCohorts(sessions), [sessions]);
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");

  if (cohorts.length < 2) return null;

  const before = cohorts.find((cohort) => cohort.id === beforeId);
  const after = cohorts.find((cohort) => cohort.id === afterId);
  const isSameVersion = beforeId.length > 0 && beforeId === afterId;
  const comparison =
    before && after && !isSameVersion
      ? compareSessionGroups(before.sessions, after.sessions)
      : null;
  const optionLabel = (cohort: SnapshotCohort): string =>
    t("versionOption", {
      date: format.dateTime(cohort.date, {
        dateStyle: "medium",
        timeZone: "UTC",
      }),
      count: cohort.sessions.length,
    });

  return (
    <section
      className="mt-3 border-t border-[var(--border)] pt-3"
      aria-labelledby="playtest-comparison"
    >
      <div className="mb-2 flex items-center gap-2">
        <GitCompareArrows className="h-3.5 w-3.5 text-sky-300" />
        <h3
          id="playtest-comparison"
          className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]"
        >
          {t("title")}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-[var(--text-secondary)]">
          {t("before")}
          <select
            aria-label={t("before")}
            value={beforeId}
            onChange={(event) => setBeforeId(event.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="">{t("choose")}</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {optionLabel(cohort)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-[var(--text-secondary)]">
          {t("after")}
          <select
            aria-label={t("after")}
            value={afterId}
            onChange={(event) => setAfterId(event.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="">{t("choose")}</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {optionLabel(cohort)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isSameVersion && (
        <p className="mt-2 text-xs text-amber-300">{t("distinct")}</p>
      )}
      {comparison?.hasComparableData && (
        <>
        <p className="mt-2 text-center text-[10px] text-[var(--text-secondary)]">
          {t("sampleSize", {
            before: comparison.beforeSessions,
            after: comparison.afterSessions,
          })}
        </p>
        {(comparison.beforeSessions < MIN_CONFIDENT_COHORT_SIZE ||
          comparison.afterSessions < MIN_CONFIDENT_COHORT_SIZE) && (
          <p className="mt-1 text-center text-[10px] text-amber-300/80">{t("earlySignal")}</p>
        )}
        <div className="mt-2 grid grid-cols-3 gap-2 rounded-md bg-[var(--background)] p-2 text-center">
          <div>
            <strong className="block text-sm text-[var(--text-primary)]">
              {t("winRateValue", { delta: comparison.winRateDelta })}
            </strong>
            <span className="text-[9px] text-[var(--text-secondary)]">{t("winRate")}</span>
          </div>
          <div>
            <strong className="block text-sm text-[var(--text-primary)]">
              {t("speedValue", {
                delta: Math.abs(comparison.winSpeedDelta),
                direction: comparison.winSpeedDelta >= 0 ? "faster" : "slower",
              })}
            </strong>
            <span className="text-[9px] text-[var(--text-secondary)]">{t("speed")}</span>
          </div>
          <div>
            <strong className="block text-sm text-[var(--text-primary)]">
              {t("mulliganValue", {
                delta: Math.abs(comparison.averageMulligansDelta),
                direction:
                  comparison.averageMulligansDelta <= 0 ? "fewer" : "more",
              })}
            </strong>
            <span className="text-[9px] text-[var(--text-secondary)]">{t("mulligans")}</span>
          </div>
        </div>
        </>
      )}
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-secondary)]">
        {t("methodology")}
      </p>
    </section>
  );
}
