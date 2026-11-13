"use client";

import { useEffect, useMemo } from "react";
import { AlertCircle, Loader2, TrendingUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMetaShifts } from "@/hooks/useMetaShifts";
import { buildMetaTrendView, type MetaTrendViewRow } from "@/lib/meta/history";

const MAX_TRENDS_SHOWN = 5;

function MetaTrendRow({ row }: { readonly row: MetaTrendViewRow }) {
  const t = useTranslations("deck");
  const points = Math.round(row.magnitude * 100);
  let label: string;

  switch (row.certainty) {
    case "exact":
      label = t("meta.shifts.points", { points: `+${points}` });
      break;
    case "at-least":
      label = t("meta.shifts.atLeast", { points: `+${points}` });
      break;
    case "at-most":
      label = t("meta.shifts.atMost", { points: `-${points}` });
      break;
    default: {
      const exhaustive: never = row.certainty;
      return exhaustive;
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="min-w-0 truncate text-[var(--text-primary)]">{row.name}</span>
      <span className="shrink-0 tabular-nums text-[var(--text-secondary)]">{label}</span>
    </li>
  );
}

/**
 * Displays EDHREC movements without misrepresenting entries and exits as exact data.
 *
 * @param commanderName - commander whose locally recorded EDHREC history is read
 * @returns the standalone, uncertainty-aware trend panel
 */
export function MetaTrendsView({ commanderName }: { readonly commanderName: string | null }) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const { report, isLoading, error, fetchShifts } = useMetaShifts(commanderName);
  const view = useMemo(() => buildMetaTrendView(report), [report]);
  const rows = useMemo(
    () => (view?.rows ?? []).filter((row) => row.magnitude > 0).slice(0, MAX_TRENDS_SHOWN),
    [view]
  );
  const captureWindow = useMemo(() => {
    if (!report) return null;
    const options = { dateStyle: "medium" } satisfies Intl.DateTimeFormatOptions;
    return `${format.dateTime(new Date(report.baselineCapturedOn), options)} – ${format.dateTime(new Date(report.currentCapturedOn), options)}`;
  }, [format, report]);

  useEffect(() => {
    if (commanderName) void fetchShifts();
  }, [commanderName, fetchShifts]);

  if (!commanderName) return null;

  return (
    <section
      aria-labelledby="meta-trends-title"
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="meta-trends-title"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]"
        >
          <TrendingUp className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
          {t("meta.shifts.title")}
        </h2>
        <span className="shrink-0 rounded bg-[var(--surface-hover)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
          EDHREC top {view?.sourceLimit ?? 20}
        </span>
      </div>

      <p className="text-[10px] leading-relaxed text-[var(--text-secondary)]">
        {t("meta.shifts.enteredHint")} {t("meta.shifts.leftHint")}
      </p>

      {captureWindow && (
        <p className="text-[10px] tabular-nums text-[var(--text-secondary)]">
          {captureWindow}
        </p>
      )}

      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-text)]" />}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("meta.shifts.error")}
        </p>
      )}

      {!isLoading && !error && !view && (
        <p className="text-xs text-[var(--text-secondary)]">{t("meta.shifts.empty")}</p>
      )}

      {rows.length > 0 && (
        <ul className="space-y-1" aria-label={t("meta.shifts.title")}>
          {rows.map((row) => (
            <MetaTrendRow key={`${row.certainty}:${row.name}`} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}
