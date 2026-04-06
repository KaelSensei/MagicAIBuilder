"use client";
/**
 * FormatSelector — dropdown for choosing deck format at creation time.
 * Defaults to Commander. Used in the home page deck creation flow.
 */
import { FORMAT_OPTIONS } from "@/lib/deck/formats";
import type { DeckFormat } from "@/lib/deck/formats";

interface FormatSelectorProps {
  readonly value: DeckFormat;
  readonly onChange: (format: DeckFormat) => void;
  readonly className?: string;
}

export function FormatSelector({ value, onChange, className }: FormatSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DeckFormat)}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] ${className ?? ""}`}
    >
      {FORMAT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
