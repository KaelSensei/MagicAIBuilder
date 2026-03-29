"use client";
// Toolbar for sorting and grouping cards in the DeckEditor
import { ArrowDownAZ, ArrowUpAZ, Layers } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useDeckStore } from "@/lib/deck/store";
import type { SortField, GroupBy } from "@/lib/deck/sort";

interface SortOption {
  field: SortField;
  label: string;
}

interface GroupOption {
  value: GroupBy;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: "cmc",   label: "CMC" },
  { field: "name",  label: "Name" },
  { field: "price", label: "Price" },
  { field: "color", label: "Color" },
  { field: "type",  label: "Type" },
];

const GROUP_OPTIONS: GroupOption[] = [
  { value: "none",  label: "Ungrouped" },
  { value: "type",  label: "By Type" },
  { value: "cmc",   label: "By CMC" },
  { value: "color", label: "By Color" },
];

export function SortGroupToolbar() {
  const sortField    = useDeckStore((s) => s.sortField);
  const sortDirection = useDeckStore((s) => s.sortDirection);
  const groupBy      = useDeckStore((s) => s.groupBy);
  const setSortField = useDeckStore((s) => s.setSortField);
  const setSortDirection = useDeckStore((s) => s.setSortDirection);
  const setGroupBy   = useDeckStore((s) => s.setGroupBy);

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
        {SORT_OPTIONS.map(({ field, label }) => {
          const isActive = sortField === field;
          return (
            <button
              key={field}
              onClick={() => handleSortFieldClick(field)}
              className={cn(
                "flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              )}
              title={`Sort by ${label} ${isActive ? (sortDirection === "asc" ? "(ascending)" : "(descending)") : ""}`}
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
        {GROUP_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setGroupBy(value)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
              groupBy === value
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            )}
            title={`Group ${label}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
