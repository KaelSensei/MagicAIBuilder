"use client";
// Color distribution visualization using CSS bars
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";

interface ColorDistributionProps {
  readonly distribution: Readonly<Record<string, number>>;
  readonly className?: string;
}

// Colour names are not repeated here: `stats.color.*` already holds them for
// the mana alignment panel, and a second copy would drift from the first.
const COLOR_CONFIG: Array<{
  key: string;
  cssVar: string;
  fallback: string;
}> = [
  { key: "W", cssVar: "--mana-white", fallback: "#f9faf4" },
  { key: "U", cssVar: "--mana-blue", fallback: "#0e68ab" },
  { key: "B", cssVar: "--mana-black", fallback: "#4a3728" },
  { key: "R", cssVar: "--mana-red", fallback: "#d3202a" },
  { key: "G", cssVar: "--mana-green", fallback: "#00733e" },
  { key: "C", cssVar: "--mana-colorless", fallback: "#ccc2c0" },
];

export function ColorDistribution({ distribution, className }: ColorDistributionProps) {
  const t = useTranslations("deck");
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);

  if (total === 0) return null;

  const colorData = COLOR_CONFIG.map((cfg) => ({
    ...cfg,
    count: distribution[cfg.key] ?? 0,
  })).filter((c) => c.count > 0);

  const maxCount = Math.max(...colorData.map((c) => c.count));

  return (
    <div className={cn("rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4", className)}>
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        {t("stats.colorDistribution")}
      </p>

      {/* Stacked color bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-px">
        {colorData.map(({ key, cssVar, fallback, count }) => (
          <div
            key={key}
            title={`${key}: ${count}`}
            style={{
              flex: count,
              backgroundColor: `var(${cssVar}, ${fallback})`,
              // White needs a border to show on dark bg
              boxShadow: key === "W" ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : undefined,
            }}
          />
        ))}
      </div>

      {/* Legend bars */}
      <div className="space-y-1.5">
        {colorData.map(({ key, cssVar, fallback, count }) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{
                backgroundColor: `var(${cssVar}, ${fallback})`,
                boxShadow: key === "W" ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : undefined,
              }}
            />
            <span className="text-xs text-[var(--text-secondary)] w-14 shrink-0">
              {t(`stats.color.${key}`)}
            </span>
            <div className="flex-1 bg-[var(--background)] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  backgroundColor: `var(${cssVar}, ${fallback})`,
                }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] w-6 text-right shrink-0">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
