"use client";
// Mana curve bar chart
import { motion } from "framer-motion";
import { cn } from "@/components/ui/utils";

interface ManaCurveProps {
  readonly curve: Readonly<Record<number, number>>;
  readonly className?: string;
}

export function ManaCurve({ curve, className }: ManaCurveProps) {
  const buckets = Array.from({ length: 8 }, (_, i) => i);
  const maxCount = Math.max(...buckets.map((b) => curve[b] ?? 0), 1);

  const CMC_COLORS = [
    "#9ca3af", // 0
    "#22c55e", // 1
    "#3b82f6", // 2
    "#a855f7", // 3
    "#f59e0b", // 4
    "#ef4444", // 5
    "#ec4899", // 6
    "#78716c", // 7+
  ];

  return (
    <div className={cn("rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4", className)}>
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        Mana Curve
      </p>
      <div className="flex items-end gap-1.5 h-24">
        {buckets.map((cmc) => {
          const count = curve[cmc] ?? 0;
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={cmc} className="flex flex-col items-center flex-1 gap-1">
              <span className="text-[10px] text-[var(--text-secondary)]">
                {count > 0 ? count : ""}
              </span>
              <motion.div
                className="w-full rounded-t"
                style={{ backgroundColor: CMC_COLORS[cmc] ?? CMC_COLORS[7] }}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.4, delay: cmc * 0.05 }}
              />
              <span className="text-[10px] text-[var(--text-secondary)]">
                {cmc === 7 ? "7+" : cmc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
