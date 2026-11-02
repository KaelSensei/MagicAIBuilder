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
  readonly blocking?: boolean;
}

function WarningSection({ title, warnings, tone, blocking = false }: WarningSectionProps) {
  if (warnings.length === 0) return null;
  const Icon = { red: AlertCircle, amber: AlertTriangle, blue: Lightbulb }[tone];
  const color = { red: "text-red-400", amber: "text-amber-400", blue: "text-blue-400" }[tone];

  return (
    <section
      className={blocking ? "space-y-1 rounded-md border border-red-500/30 bg-red-500/10 p-2.5" : "space-y-1"}
      aria-label={title}
      role={blocking ? "alert" : undefined}
    >
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
      <WarningSection
        title={t("bracket.warningGroups.legality")}
        warnings={groups.legality}
        tone="red"
        blocking
      />
      {(groups.strategy.length > 0 || groups.advice.length > 0) && (
        <section className="space-y-2.5 border-t border-[var(--border)] pt-2.5" aria-label={t("bracket.warningGroups.optional")}>
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            {t("bracket.warningGroups.optional")}
          </p>
          <WarningSection title={t("bracket.warningGroups.strategy")} warnings={groups.strategy} tone="amber" />
          <WarningSection title={t("bracket.warningGroups.advice")} warnings={groups.advice} tone="blue" />
        </section>
      )}
    </div>
  );
}
