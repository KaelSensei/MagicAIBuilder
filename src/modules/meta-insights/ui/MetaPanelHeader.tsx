"use client";
/**
 * The meta panel's header: the button that opens and closes it, with the
 * loading spinner while a source reads and the chevron that shows its state.
 *
 * Meta-insights context, `ui/`. Presentational; `MetaPanel` owns the state.
 *
 * @module meta-insights/ui/MetaPanelHeader
 */
import { useTranslations } from "next-intl";
import { BarChart2, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/components/ui/utils";

/** The header's state and its one action. */
export interface MetaPanelHeaderProps {
  readonly expanded: boolean;
  /** Shows the spinner while either source loads. */
  readonly isFetching: boolean;
  readonly onToggle: () => void;
}

/** The full-width toggle button, named by the panel's title ("Meta Analysis"). */
export function MetaPanelHeader({
  expanded,
  isFetching,
  onToggle,
}: MetaPanelHeaderProps) {
  const t = useTranslations("deck");
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
    >
      <BarChart2 className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
      <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">
        {t("meta.title")}
      </span>
      {isFetching && (
        <Loader2 className="w-3.5 h-3.5 text-[var(--accent-text)] animate-spin" />
      )}
      <TrendingUp
        className={cn(
          "w-3.5 h-3.5 transition-transform",
          expanded ? "rotate-180" : ""
        )}
      />
    </button>
  );
}
