"use client";
// 5→1 star distribution bars for a deck's rating breakdown.
import { useTranslations } from "next-intl";
import type { RatingHistogram } from "@/lib/ratings/ratings";

const STARS_DESCENDING = [5, 4, 3, 2, 1] as const;

interface RatingHistogramBarsProps {
  readonly histogram: RatingHistogram;
  readonly total: number;
}

export function RatingHistogramBars({ histogram, total }: RatingHistogramBarsProps) {
  const t = useTranslations("deck.ratings");

  return (
    <ul className="flex flex-col gap-1 list-none p-0 m-0">
      {STARS_DESCENDING.map((star) => {
        const count = histogram[star];
        const percent = total === 0 ? 0 : Math.round((count / total) * 100);

        return (
          <li key={star} className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-8 shrink-0" aria-hidden="true">
              {star} ★
            </span>
            <div
              className="flex-1 h-2 rounded-full bg-[var(--background)] overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("starLabel", { count: star })}
            >
              <div className="h-full bg-amber-400/70" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-[var(--text-secondary)] w-8 text-right shrink-0">
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
