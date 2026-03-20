"use client";
// Color identity, type, CMC, price filters
import { cn } from "@/components/ui/utils";
import type { SearchFilters } from "@/lib/deck/types";

const COLORS = [
  { code: "W", label: "White", symbol: "☀️" },
  { code: "U", label: "Blue", symbol: "💧" },
  { code: "B", label: "Black", symbol: "💀" },
  { code: "R", label: "Red", symbol: "🔥" },
  { code: "G", label: "Green", symbol: "🌲" },
];

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  className?: string;
}

export function SearchFilters({ filters, onChange, className }: SearchFiltersProps) {
  const toggleColor = (color: string) => {
    const colors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onChange({ ...filters, colors });
  };

  return (
    <div className={cn("space-y-3 p-3", className)}>
      {/* Color filter */}
      <div>
        <p className="text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
          Colors
        </p>
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.code}
              onClick={() => toggleColor(c.code)}
              className={cn(
                "w-8 h-8 rounded-full text-sm transition-all border-2",
                filters.colors.includes(c.code)
                  ? "border-[var(--accent)] scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              title={c.label}
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* CMC range */}
      <div className="flex gap-2 items-center">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10">
          CMC
        </p>
        <input
          type="number"
          min={0}
          max={20}
          value={filters.cmcMin ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              cmcMin: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          placeholder="Min"
          className="w-16 text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <span className="text-[var(--text-secondary)] text-xs">—</span>
        <input
          type="number"
          min={0}
          max={20}
          value={filters.cmcMax ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              cmcMax: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          placeholder="Max"
          className="w-16 text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Price max */}
      <div className="flex gap-2 items-center">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10">
          Max $
        </p>
        <input
          type="number"
          min={0}
          value={filters.priceMax ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              priceMax: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          placeholder="No limit"
          className="w-24 text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      </div>
    </div>
  );
}
