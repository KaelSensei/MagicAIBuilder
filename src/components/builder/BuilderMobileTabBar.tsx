"use client";
/**
 * The builder's bottom tab bar on phones and tablets: Search, Deck and Stats,
 * one panel at a time. Not a segmented control: it is a full-width tab bar
 * pinned to the bottom of the screen.
 *
 * @module components/builder/BuilderMobileTabBar
 */
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
 *
 * The active tab is pressed for screen readers (WCAG 2.2 SC 4.1.2) and
 * carries a 2 px bar on top, so it does not rely on its fill colour alone
 * (SC 1.4.1). Each tab is at least 48 px tall, and the bar pads itself by the
 * iOS home indicator's inset (design audit S3, 2026-11-25).
 */
export function BuilderMobileTabBar({
  activePanel,
  onSelect,
}: BuilderMobileTabBarProps) {
  const t = useTranslations("builder");
  return (
    <div className="absolute right-0 bottom-0 left-0 z-30 flex border-t border-[var(--border)] bg-[var(--surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      {MOBILE_TABS.map((tab) => {
        const active = activePanel === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            aria-pressed={active}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors",
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent-text)] before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-[var(--accent-text)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {t(`mobileTabs.${tab.id}`)}
          </button>
        );
      })}
    </div>
  );
}
