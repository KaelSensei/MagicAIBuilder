"use client";
/**
 * FormatSelector — dropdown for choosing deck format at creation time.
 * Defaults to Commander. Used in the home page deck creation flow.
 */
import { FORMAT_OPTIONS } from "@/lib/deck/formats";
import type { DeckFormat } from "@/lib/deck/formats";
import { fieldShellClassName } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";

interface FormatSelectorProps {
  readonly value: DeckFormat;
  readonly onChange: (format: DeckFormat) => void;
  readonly className?: string;
}

/**
 * Checks whether a select value is a supported deck format.
 *
 * @param value - raw option value
 * @returns true when the value is one of `FORMAT_OPTIONS`
 */
function isDeckFormat(value: string): value is DeckFormat {
  return FORMAT_OPTIONS.some((option) => option.value === value);
}

export function FormatSelector({ value, onChange, className }: FormatSelectorProps) {
  return (
    <select
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        if (isDeckFormat(next)) onChange(next);
      }}
      className={cn(fieldShellClassName, "bg-[var(--surface)] px-3 py-2", className)}
    >
      {FORMAT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
