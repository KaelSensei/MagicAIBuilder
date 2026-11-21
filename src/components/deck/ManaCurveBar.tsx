"use client";
/**
 * One bar of the mana curve: its figure and its hover tooltip.
 *
 * @module components/deck/ManaCurveBar
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

interface ManaCurveBarProps {
  readonly bucket: number;
  readonly count: number;
  readonly maxCount: number;
}

/** The top bucket of the curve: it holds every card of mana value 7 or more. */
const TOP_BUCKET = 7;

// MTG-inspired color palette per CMC bucket
const CMC_COLORS: Readonly<Record<number, string>> = {
  0: "#6b7280", // gray (colorless)
  1: "#10b981", // emerald
  2: "#3b82f6", // blue
  3: "#8b5cf6", // violet
  4: "#f59e0b", // amber
  5: "#ef4444", // red
  6: "#ec4899", // pink
  7: "#64748b", // slate (7+)
};

/** A bar's label: "7+" for the top bucket. */
export function bucketLabel(bucket: number): string {
  return bucket === TOP_BUCKET ? "7+" : String(bucket);
}

/**
 * One bar of the mana curve.
 *
 * @param props.bucket - the mana value it counts, 7 for 7 and more
 * @param props.count - its figure, from `buildManaCurve`
 * @param props.maxCount - the tallest bar's figure, which sets the scale
 */
export function ManaCurveBar({ bucket, count, maxCount }: ManaCurveBarProps) {
  const t = useTranslations("deck");
  const [hovered, setHovered] = useState(false);
  const label = t("stats.curveBucket", { cmc: bucketLabel(bucket), count });
  const color = CMC_COLORS[bucket] ?? CMC_COLORS[TOP_BUCKET];

  return (
    <button
      type="button"
      className="relative flex flex-col items-center flex-1 h-full justify-end bg-transparent border-0 p-0 cursor-default focus:outline-none"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && count > 0 && (
          <motion.div
            className="absolute bottom-full mb-2 whitespace-nowrap z-10 bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] pointer-events-none shadow-lg"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bar — positioned from bottom */}
      <motion.div
        className="w-full relative"
        style={{
          background: `linear-gradient(to bottom, ${color}99, ${color})`,
          borderRadius: "4px 4px 0 0",
          opacity: hovered ? 1 : 0.85,
        }}
        initial={{ height: 0 }}
        animate={{ height: `${(count / maxCount) * 100}%` }}
        transition={{
          duration: 0.5,
          delay: bucket * 0.06,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {/* Count label pinned just above the bar top */}
        <AnimatePresence mode="wait">
          {count > 0 && (
            <motion.span
              key={count}
              className="absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] font-medium text-[var(--text-secondary)] whitespace-nowrap"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
