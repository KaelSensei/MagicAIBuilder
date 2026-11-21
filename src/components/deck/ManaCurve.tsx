"use client";
// Premium mana curve bar chart — Linear/Vercel dashboard aesthetic
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import { bucketLabel, ManaCurveBar } from "./ManaCurveBar";

interface ManaCurveProps {
  readonly curve: Readonly<Record<number, number>>;
  readonly className?: string;
}

// Ghost grid lines at 25%, 50%, 75%, 100% of chart height
const GRID_LINES = [0.25, 0.5, 0.75, 1];

export function ManaCurve({ curve, className }: ManaCurveProps) {
  const t = useTranslations("deck");
  const buckets = Array.from({ length: 8 }, (_, i) => i);

  const maxCount = Math.max(...buckets.map((b) => curve[b] ?? 0), 1);

  // Weighted average CMC (excludes 0-cost cards from average denominator for cleaner stat)
  const { totalCards, totalMana } = buckets.reduce(
    (acc, cmc) => {
      const count = curve[cmc] ?? 0;
      return {
        totalCards: acc.totalCards + count,
        totalMana: acc.totalMana + count * cmc,
      };
    },
    { totalCards: 0, totalMana: 0 }
  );
  const avgCmc = totalCards > 0 ? (totalMana / totalCards).toFixed(1) : "—";

  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-widest">
          {t("stats.manaCurve")}
        </p>
        <span className="text-xs text-[var(--text-secondary)] tabular-nums">
          {t("stats.avgCmcInline", { value: avgCmc })}
        </span>
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height: 140 }}>
        {/* Ghost grid lines */}
        {GRID_LINES.map((frac) => (
          <div
            key={frac}
            className="absolute left-0 right-0 border-t border-white/10"
            style={{ bottom: `${frac * 100}%` }}
          />
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1.5">
          {buckets.map((cmc) => (
            <ManaCurveBar
              key={cmc}
              bucket={cmc}
              count={curve[cmc] ?? 0}
              maxCount={maxCount}
            />
          ))}
        </div>
      </div>

      {/* CMC labels below chart */}
      <div className="flex gap-1.5 mt-1.5">
        {buckets.map((cmc) => (
          <div key={cmc} className="flex-1 flex justify-center">
            <span className="text-[10px] text-[var(--text-secondary)]">
              {bucketLabel(cmc)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
