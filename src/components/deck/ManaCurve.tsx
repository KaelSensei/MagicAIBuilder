"use client";
// Premium mana curve bar chart — Linear/Vercel dashboard aesthetic
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";

interface ManaCurveProps {
  readonly curve: Readonly<Record<number, number>>;
  readonly className?: string;
}

// MTG-inspired color palette per CMC bucket
const CMC_COLORS: Record<number, string> = {
  0: "#6b7280", // gray (colorless)
  1: "#10b981", // emerald
  2: "#3b82f6", // blue
  3: "#8b5cf6", // violet
  4: "#f59e0b", // amber
  5: "#ef4444", // red
  6: "#ec4899", // pink
  7: "#64748b", // slate (7+)
};

// Ghost grid lines at 25%, 50%, 75%, 100% of chart height
const GRID_LINES = [0.25, 0.5, 0.75, 1];

export function ManaCurve({ curve, className }: ManaCurveProps) {
  const buckets = Array.from({ length: 8 }, (_, i) => i);
  const [hoveredCmc, setHoveredCmc] = useState<number | null>(null);

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
          Mana Curve
        </p>
        <span className="text-xs text-[var(--text-secondary)] tabular-nums">
          Avg CMC: {avgCmc}
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
          {buckets.map((cmc, index) => {
            const count = curve[cmc] ?? 0;
            const heightPct = (count / maxCount) * 100;
            const color = CMC_COLORS[cmc] ?? CMC_COLORS[7];
            const isHovered = hoveredCmc === cmc;

            return (
              <div
                key={cmc}
                className="relative flex flex-col items-center flex-1 h-full justify-end"
                onMouseEnter={() => setHoveredCmc(cmc)}
                onMouseLeave={() => setHoveredCmc(null)}
              >
                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && count > 0 && (
                    <motion.div
                      className="absolute bottom-full mb-2 whitespace-nowrap z-10 bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] pointer-events-none shadow-lg"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      {count} card{count !== 1 ? "s" : ""} at CMC {cmc === 7 ? "7+" : cmc}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Count label above bar */}
                <div className="absolute w-full flex justify-center" style={{ bottom: `${heightPct}%` }}>
                  <AnimatePresence mode="wait">
                    {count > 0 && (
                      <motion.span
                        key={count}
                        className="text-[10px] font-medium text-[var(--text-secondary)] -translate-y-3"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        {count}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bar */}
                <motion.div
                  className="w-full"
                  style={{
                    background: `linear-gradient(to bottom, ${color}99, ${color})`,
                    borderRadius: "4px 4px 0 0",
                    opacity: isHovered ? 1 : 0.85,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.06,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* CMC labels below chart */}
      <div className="flex gap-1.5 mt-1.5">
        {buckets.map((cmc) => (
          <div key={cmc} className="flex-1 flex justify-center">
            <span className="text-[10px] text-[var(--text-secondary)]">
              {cmc === 7 ? "7+" : cmc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
