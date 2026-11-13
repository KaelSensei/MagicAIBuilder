"use client";
/**
 * The standalone trends view of the builder page: the largest movements in
 * the commander's EDHREC list over the recorded window, each marked exact or
 * bounded.
 *
 * Meta-insights context, `ui/`. Reads the history through `useMetaShifts`
 * on its own, apart from the meta panel, and renders `buildMetaTrendView`
 * from `domain/history.ts`. It states EDHREC's top-20 limit beside the list
 * because an entry or an exit is a bound, not a measured change, and a
 * reader who misses that would read a ranking change as a collapse.
 *
 * @module meta-insights/ui/MetaTrendsView
 */
import { useEffect, useMemo } from "react";
import { AlertCircle, Loader2, TrendingUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMetaShifts } from "@/modules/meta-insights/client/useMetaShifts";
import { buildMetaTrendView, type MetaTrendViewRow } from "@/modules/meta-insights/domain/history";

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
 * The trends section for one commander: at most five movements, largest
 * first, with "≥" or "≤" on the bounded ones, the two snapshot dates, and the
 * loading, error and "no history yet" states. Renders nothing without a
 * commander.
 *
 * @param commanderName - commander whose locally recorded EDHREC history is read
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
