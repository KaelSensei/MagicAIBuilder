"use client";
// Color identity, type, CMC, price filters
import { cn } from "@/components/ui/utils";
import type { SearchFilters } from "@/lib/deck/types";
import { useCollectionStore } from "@/lib/collection/store";

const COLORS = [
  { code: "W", label: "White" },
  { code: "U", label: "Blue" },
  { code: "B", label: "Black" },
  { code: "R", label: "Red" },
  { code: "G", label: "Green" },
];

interface SearchFiltersProps {
  readonly filters: SearchFilters;
  readonly onChange: (filters: SearchFilters) => void;
  readonly className?: string;
}

export function SearchFilters({ filters, onChange, className }: SearchFiltersProps) {
  const collectionSize = useCollectionStore(
    (s) => Object.keys(s.collectionCards).length + Object.keys(s.collectionCardsFoil).length
  );

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
                "w-8 h-8 rounded-full transition-all border-2 flex items-center justify-center",
                filters.colors.includes(c.code)
                  ? "border-[var(--accent)] scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              title={c.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://svgs.scryfall.io/card-symbols/${c.code}.svg`}
                alt={c.label}
                width={22}
                height={22}
                className="w-[22px] h-[22px]"
              />
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
              cmcMin: e.target.value ? Number.parseInt(e.target.value) : null,
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
              cmcMax: e.target.value ? Number.parseInt(e.target.value) : null,
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
              priceMax: e.target.value ? Number.parseFloat(e.target.value) : null,
            })
          }
          placeholder="No limit"
          className="w-24 text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Collection only toggle */}
      {collectionSize > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() =>
              onChange({ ...filters, collectionOnly: !filters.collectionOnly })
            }
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors",
              filters.collectionOnly
                ? "border-green-500 text-green-400 bg-green-500/10"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-green-500/50"
            )}
          >
            <span className="text-sm">📦</span>
            {filters.collectionOnly ? "Collection only" : "Show collection only"}
          </button>
        </div>
      )}
    </div>
  );
}
