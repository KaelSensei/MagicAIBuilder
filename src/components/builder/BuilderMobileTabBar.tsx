"use client";

import { useTranslations } from "next-intl";
import { BarChart3, LayoutGrid, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/utils";

/** The builder panel shown on its own below the `lg` breakpoint. */
export type BuilderMobilePanel = "search" | "deck" | "stats";

interface MobileTab {
  readonly id: BuilderMobilePanel;
  readonly icon: LucideIcon;
}

/** Labels live under `builder.mobileTabs.<id>`. */
const MOBILE_TABS: readonly MobileTab[] = [
  { id: "search", icon: Search },
  { id: "deck", icon: LayoutGrid },
  { id: "stats", icon: BarChart3 },
];

export interface BuilderMobileTabBarProps {
  /** Panel currently visible below `lg`. */
  readonly activePanel: BuilderMobilePanel;
  /** Called with the panel whose tab was pressed. */
  readonly onSelect: (panel: BuilderMobilePanel) => void;
}

/**
 * Bottom tab bar that picks the one builder panel visible below `lg`.
 * From `lg` up the three panels sit side by side and the bar is hidden.
 */
export function BuilderMobileTabBar({
  activePanel,
  onSelect,
}: BuilderMobileTabBarProps) {
  const t = useTranslations("builder");
  return (
    <div className="absolute right-0 bottom-0 left-0 z-30 flex border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md lg:hidden">
      {MOBILE_TABS.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
            activePanel === tab.id
              ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
              : "text-[var(--text-secondary)]"
          )}
        >
          <tab.icon className="w-4 h-4" />
          {t(`mobileTabs.${tab.id}`)}
        </button>
      ))}
    </div>
  );
}
