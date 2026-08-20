"use client";
// Toolbar for sorting and grouping cards in the DeckEditor
import { useTranslations } from "next-intl";
import { ArrowDownAZ, ArrowUpAZ, Layers } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useDeckStore } from "@/lib/deck/store";
import type { SortField, GroupBy } from "@/lib/deck/sort";

interface SortOption {
  field: SortField;
  /** Key under `builder.sort.fields`. */
  labelKey: string;
}

interface GroupOption {
  value: GroupBy;
  /** Key under `builder.sort.groups`. */
  labelKey: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: "cmc", labelKey: "cmc" },
  { field: "name", labelKey: "name" },
  { field: "price", labelKey: "price" },
  { field: "color", labelKey: "color" },
  { field: "type", labelKey: "type" },
];

const GROUP_OPTIONS: GroupOption[] = [
  { value: "none", labelKey: "none" },
  { value: "type", labelKey: "type" },
  { value: "cmc", labelKey: "cmc" },
  { value: "color", labelKey: "color" },
];

export function SortGroupToolbar() {
  const t = useTranslations("builder");
  const sortField = useDeckStore((s) => s.sortField);
  const sortDirection = useDeckStore((s) => s.sortDirection);
  const groupBy = useDeckStore((s) => s.groupBy);
  const setSortField = useDeckStore((s) => s.setSortField);
  const setSortDirection = useDeckStore((s) => s.setSortDirection);
  const setGroupBy = useDeckStore((s) => s.setGroupBy);

  function handleSortFieldClick(field: SortField) {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
    }
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 border-b border-[var(--border)] flex-wrap">
      {/* Sort buttons */}
      <div className="flex items-center gap-0.5">
        {SORT_OPTIONS.map(({ field, labelKey }) => {
          const label = t(`sort.fields.${labelKey}`);
          const isActive = sortField === field;
          let activeSortHint = "";
          if (isActive) {
            activeSortHint =
              sortDirection === "asc" ? t("sort.ascending") : t("sort.descending");
          }
          return (
            <button
              type="button"
              key={field}
              onClick={() => handleSortFieldClick(field)}
              className={cn(
                "flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              )}
              title={t("actions.sortByField", { label, hint: activeSortHint }).trim()}
            >
              {label}
              {isActive && sortDirection === "asc" && (
                <ArrowUpAZ className="w-3 h-3" />
              )}
              {isActive && sortDirection === "desc" && (
                <ArrowDownAZ className="w-3 h-3" />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[var(--border)] mx-0.5" />

      {/* Group by selector */}
      <div className="flex items-center gap-0.5">
        <Layers className="w-3 h-3 text-[var(--text-secondary)]" />
        {GROUP_OPTIONS.map(({ value, labelKey }) => (
          <button
            type="button"
            key={value}
            onClick={() => setGroupBy(value)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
              groupBy === value
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            )}
            title={t("actions.groupByField", { label: t(`sort.groups.${labelKey}`) })}
          >
            {t(`sort.groups.${labelKey}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
