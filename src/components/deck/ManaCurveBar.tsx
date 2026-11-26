"use client";
/**
 * One bar of the mana curve: its figure, its hover tooltip and, when the chart knows the deck's
 * cards, its permanents and spells stacked, and a pressed state that opens the bar's card list.
 *
 * Colour never carries a meaning alone (WCAG 1.4.1): the spells part is striped, the legend names
 * both parts, and the accessible name gives both counts.
 *
 * @module components/deck/ManaCurveBar
 */
import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { CURVE_TOP_BUCKET, type CurveParts } from "@/lib/deck/curve-breakdown";

/** What a bar does when the chart knows the deck's cards. */
export interface CurveBarSelection {
  readonly parts: CurveParts;
  readonly pressed: boolean;
  readonly onToggle: (bucket: number) => void;
  readonly onClose: () => void;
}

interface ManaCurveBarProps {
  readonly bucket: number;
  readonly count: number;
  readonly maxCount: number;
  /** Absent on a chart without cards (the shared deck view): one plain bar, not pressable. */
  readonly selection?: CurveBarSelection;
}

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
  return bucket === CURVE_TOP_BUCKET ? "7+" : String(bucket);
}

/** The solid fill of the permanents part. */
export function permanentFill(color: string): string {
  return `linear-gradient(to bottom, ${color}99, ${color})`;
}

/** The striped fill of the spells part, so the parts differ by more than colour. */
export function spellFill(color: string): string {
  return `repeating-linear-gradient(135deg, ${color}, ${color} 3px, ${color}55 3px, ${color}55 6px)`;
}

/** The stacked parts of a bar, spells on top; one plain part without a selection. */
function BarParts({
  color,
  count,
  parts,
}: {
  readonly color: string;
  readonly count: number;
  readonly parts: CurveParts | undefined;
}) {
  const stack = parts
    ? [
        { side: "spell", copies: parts.spells, fill: spellFill(color) },
        {
          side: "permanent",
          copies: parts.permanents,
          fill: permanentFill(color),
        },
      ]
    : [{ side: "all", copies: count, fill: permanentFill(color) }];
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-t"
      aria-hidden="true"
    >
      {stack.map(({ side, copies, fill }) => (
        <div
          key={side}
          data-part={side}
          style={{ flexGrow: copies, flexBasis: 0, background: fill }}
        />
      ))}
    </div>
  );
}

/**
 * One bar of the mana curve.
 *
 * @param props.bucket - the mana value it counts, `CURVE_TOP_BUCKET` for 7 and more
 * @param props.count - its figure, from `buildManaCurve`
 * @param props.maxCount - the tallest bar's figure, which sets the scale
 * @param props.selection - its parts and pressed state, when the chart knows the deck's cards
 */
export function ManaCurveBar({
  bucket,
  count,
  maxCount,
  selection,
}: ManaCurveBarProps) {
  const t = useTranslations("deck");
  const [hovered, setHovered] = useState(false);
  const cmc = bucketLabel(bucket);
  const label = selection
    ? t("curve.barLabel", { cmc, ...selection.parts })
    : t("stats.curveBucket", { cmc, count });
  const color = CMC_COLORS[bucket] ?? CMC_COLORS[CURVE_TOP_BUCKET];

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") selection?.onClose();
  };

  return (
    <button
      type="button"
      className={cn(
        "relative flex flex-col items-center flex-1 h-full justify-end bg-transparent border-0 p-0",
        selection
          ? "cursor-pointer disabled:cursor-default rounded-t"
          : "cursor-default"
      )}
      aria-label={label}
      aria-pressed={selection?.pressed}
      disabled={selection !== undefined && count === 0}
      onClick={() => selection?.onToggle(bucket)}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
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

      <motion.div
        className="w-full relative"
        style={{ opacity: hovered || selection?.pressed ? 1 : 0.85 }}
        initial={{ height: 0 }}
        animate={{ height: `${(count / maxCount) * 100}%` }}
        transition={{
          duration: 0.5,
          delay: bucket * 0.06,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <BarParts color={color} count={count} parts={selection?.parts} />
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
