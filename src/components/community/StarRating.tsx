"use client";
// Star row used both as a read-only average display and as a 1–5 input.
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

const STARS = [1, 2, 3, 4, 5] as const;

interface StarRatingProps {
  readonly value: number;
  /** Omit to render a read-only display. */
  readonly onSelect?: (rating: number) => void;
  readonly disabled?: boolean;
  readonly size?: "sm" | "md";
}

const SIZE_CLASSES = { sm: "w-3.5 h-3.5", md: "w-5 h-5" } as const;

export function StarRating({ value, onSelect, disabled, size = "md" }: StarRatingProps) {
  const t = useTranslations("deck.ratings");
  const starClass = SIZE_CLASSES[size];

  function starFill(star: number) {
    return star <= Math.round(value)
      ? "fill-amber-400 text-amber-400"
      : "text-[var(--border)]";
  }

  if (!onSelect) {
    return (
      <div className="flex items-center gap-0.5" aria-label={t("average", { average: value })}>
        {STARS.map((star) => (
          <Star key={star} className={`${starClass} ${starFill(star)}`} aria-hidden="true" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(star)}
          aria-label={t("starLabel", { count: star })}
          aria-pressed={star <= Math.round(value)}
          className="p-0.5 rounded disabled:opacity-60 hover:scale-110 transition-transform"
        >
          <Star className={`${starClass} ${starFill(star)}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
