"use client";

import { AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { groupDeckWarnings } from "@/lib/deck/warning-groups";

interface GroupedDeckWarningsProps {
  readonly warnings: readonly string[];
}

interface WarningSectionProps {
  readonly title: string;
  readonly warnings: readonly string[];
  readonly tone: "red" | "amber" | "blue";
}

function WarningSection({ title, warnings, tone }: WarningSectionProps) {
  if (warnings.length === 0) return null;
  const Icon = tone === "red" ? AlertCircle : tone === "amber" ? AlertTriangle : Lightbulb;
  const color = tone === "red" ? "text-red-400" : tone === "amber" ? "text-amber-400" : "text-blue-400";

  return (
    <section className="space-y-1" aria-label={title}>
      <h4 className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {title} ({warnings.length})
      </h4>
      <ul className="space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning} className="text-xs text-[var(--text-secondary)]">
            {warning}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shows deck warnings grouped by required action instead of one undifferentiated list. */
export function GroupedDeckWarnings({ warnings }: GroupedDeckWarningsProps) {
  const t = useTranslations("deck");
  const groups = groupDeckWarnings(warnings);

  return (
    <div className="space-y-2.5">
      <WarningSection title={t("bracket.warningGroups.legality")} warnings={groups.legality} tone="red" />
      <WarningSection title={t("bracket.warningGroups.strategy")} warnings={groups.strategy} tone="amber" />
      <WarningSection title={t("bracket.warningGroups.advice")} warnings={groups.advice} tone="blue" />
    </div>
  );
}
