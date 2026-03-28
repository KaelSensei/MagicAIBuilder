"use client";
// Action bar shown when cards are selected in sideboard / maybeboard
import { ArrowRight, Trash2, CheckSquare, Square } from "lucide-react";
import type { DeckZone } from "@/lib/deck/types";

interface MoveTarget {
  readonly zone: DeckZone;
  readonly label: string;
}

interface BulkSelectBarProps {
  readonly selectedCount: number;
  readonly totalCount: number;
  readonly moveTargets: readonly MoveTarget[];
  readonly onSelectAll: () => void;
  readonly onDeselectAll: () => void;
  readonly onBulkMove: (zone: DeckZone) => void;
  readonly onBulkDelete: () => void;
}

export function BulkSelectBar({
  selectedCount,
  totalCount,
  moveTargets,
  onSelectAll,
  onDeselectAll,
  onBulkMove,
  onBulkDelete,
}: BulkSelectBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] border-b border-[var(--border)] flex-wrap">
      {/* Select all / deselect all */}
      <button
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
        aria-label={allSelected ? "Deselect all" : "Select all"}
      >
        {allSelected ? (
          <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
        ) : (
          <Square className="w-3.5 h-3.5" />
        )}
        {allSelected ? "Deselect all" : "Select all"}
      </button>

      {/* Selection counter */}
      {selectedCount > 0 && (
        <>
          <span className="text-xs text-[var(--text-secondary)]">·</span>
          <span className="text-xs font-medium text-[var(--accent)]">
            {selectedCount} card{selectedCount === 1 ? "" : "s"} selected
          </span>

          {/* Move actions */}
          {moveTargets.map(({ zone, label }) => (
            <button
              key={zone}
              onClick={() => onBulkMove(zone)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors shrink-0"
            >
              <ArrowRight className="w-3 h-3" />
              {label}
            </button>
          ))}

          {/* Delete action */}
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </>
      )}
    </div>
  );
}
