"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/components/ui/utils";

export type DeckZoneTabId = "main" | "sideboard" | "maybeboard";

interface DeckZoneTabProps {
  readonly zone: DeckZoneTabId;
  readonly label: string;
  readonly count: number;
  readonly isActive: boolean;
  readonly onSelect: (zone: DeckZoneTabId) => void;
}

/**
 * A stable cross-zone drop target that also selects its zone when clicked.
 *
 * @param props - Zone label, count and selection callback.
 * @returns The zone tab button.
 */
export function DeckZoneTab({
  zone,
  label,
  count,
  isActive,
  onSelect,
}: DeckZoneTabProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `deck-panel-${zone}` });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(zone)}
      aria-pressed={isActive}
      className={cn(
        "relative flex min-h-8 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-sm after:outline after:outline-2 after:outline-offset-[-2px] after:transition-opacity",
        isOver
          ? "after:outline-[var(--accent)] after:opacity-100"
          : "after:opacity-0",
        isActive
          ? "bg-[var(--accent)]/10 text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      )}
      aria-label={`${label} (${count})`}
    >
      {label}
      <span
        className={cn(
          "text-[10px] tabular-nums",
          isActive ? "text-[var(--accent-text)]" : "opacity-60"
        )}
      >
        {count}
      </span>
    </button>
  );
}
