"use client";
/**
 * The meta-shifts section of the meta panel: what moved in the commander's
 * EDHREC list since the baseline snapshot, or why there is nothing to show yet.
 *
 * Meta-insights context, `ui/`. Presentational: `useMetaPanel` supplies the
 * report and the movements worth a line.
 *
 * @module meta-insights/ui/MetaShiftsSection
 */
import { useFormatter, useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import type { MetaShiftsSectionModel } from "@/modules/meta-insights/client/useMetaPanel";
import { MetaShiftRow } from "./MetaShiftRow";
import { SkeletonRows } from "./SkeletonRows";

/** The section's model. */
export interface MetaShiftsSectionProps {
  readonly shifts: MetaShiftsSectionModel;
}

/**
 * The section, titled "Meta shifts", with the baseline date beside it once a
 * report exists. Without a report it tells "no history yet" from "recorded
 * once", by the snapshot count; with a report and no movement, it says nothing
 * moved by more than a point.
 */
export function MetaShiftsSection({ shifts }: MetaShiftsSectionProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const { report, movements } = shifts;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
          {t("meta.shifts.title")}
        </p>
        {report && (
          <span className="text-[10px] text-[var(--text-secondary)]/70 shrink-0">
            {t("meta.shifts.since", {
              date: format.dateTime(new Date(report.baselineCapturedOn)),
            })}
          </span>
        )}
      </div>

      {shifts.isLoading && !report && <SkeletonRows count={3} />}

      {shifts.error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {t("meta.shifts.error")}
        </div>
      )}

      {!shifts.isLoading && !shifts.error && !report && (
        <p className="text-xs text-[var(--text-secondary)] py-1">
          {shifts.snapshotCount > 0
            ? t("meta.shifts.pending")
            : t("meta.shifts.empty")}
        </p>
      )}

      {report && movements.length === 0 && (
        <p className="text-xs text-[var(--text-secondary)] py-1">
          {t("meta.shifts.steadyOnly")}
        </p>
      )}

      {movements.length > 0 && (
        <div className="space-y-0.5">
          {movements.map((shift) => (
            <MetaShiftRow key={`${shift.kind}:${shift.name}`} shift={shift} />
          ))}
        </div>
      )}
    </div>
  );
}
