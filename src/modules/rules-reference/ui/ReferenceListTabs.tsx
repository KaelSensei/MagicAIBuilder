"use client";
/**
 * The tab bar of the Game Changers and banlist page: one toggle per list, with
 * the list's card count once it has loaded, and a link to the Comprehensive
 * Rules page.
 *
 * Rules reference context, `ui/`. Presentational: the page owns the active
 * list and what switching does to the pager. The two tabs are plain toggle
 * buttons, as RR-01 pins them; the WAI-ARIA tabs pattern (`tablist`, `tab`,
 * `aria-selected`, arrow keys) is a follow-up, since it changes what assistive
 * technology announces.
 *
 * @module rules-reference/ui/ReferenceListTabs
 */
import { useTranslations } from "next-intl";
import { BookOpen, Shield, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/components/ui/utils";
import type { ReferenceList } from "@/modules/rules-reference/client/useReferenceLists";

/** The active list, the selection callback and each list's count once known. */
export interface ReferenceListTabsProps {
  readonly activeList: ReferenceList;
  /** Called with the tab the visitor pressed, including the active one. */
  readonly onSelect: (list: ReferenceList) => void;
  /** The Game Changers count, or `undefined` while the list has not loaded. */
  readonly gameChangersCount?: number;
  /** The banlist count, or `undefined` while the list has not loaded. */
  readonly banlistCount?: number;
}

const TAB_CLASS =
  "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors";
const INACTIVE_TAB_CLASS =
  "text-[var(--text-secondary)] hover:text-[var(--text-primary)]";

/**
 * The Game Changers and banlist toggles and the Comprehensive Rules link.
 *
 * A count shows beside a tab's label only once its list has loaded; a failed
 * or pending list shows the label alone.
 */
export function ReferenceListTabs({
  activeList,
  onSelect,
  gameChangersCount,
  banlistCount,
}: ReferenceListTabsProps) {
  const t = useTranslations("rules");

  function tabClass(list: ReferenceList): string {
    return cn(
      TAB_CLASS,
      activeList === list ? "bg-[var(--accent)] text-white" : INACTIVE_TAB_CLASS
    );
  }

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] w-fit">
      <button
        type="button"
        onClick={() => onSelect("game-changers")}
        className={tabClass("game-changers")}
      >
        <Zap className="w-3.5 h-3.5" />
        {t("tabs.gameChangers")}
        {gameChangersCount !== undefined && (
          <span className="ml-1 text-xs opacity-70">({gameChangersCount})</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onSelect("banlist")}
        className={tabClass("banlist")}
      >
        <Shield className="w-3.5 h-3.5" />
        {t("tabs.banlist")}
        {banlistCount !== undefined && (
          <span className="ml-1 text-xs opacity-70">({banlistCount})</span>
        )}
      </button>
      <Link
        href="/rules/comprehensive"
        className={cn(TAB_CLASS, INACTIVE_TAB_CLASS)}
      >
        <BookOpen className="w-3.5 h-3.5" />
        {t("comprehensive.tabLabel")}
      </Link>
    </div>
  );
}
