"use client";
/**
 * Written reviews left on a public deck, newest first, each with its author
 * chip and stars. Community context (ui); renders the reviews as the ratings
 * route serves them (`ReviewResponse`), so the list never needs the fields the
 * route sends but no page shows.
 */
import { useTranslations } from "next-intl";
import type { ReviewResponse } from "@/lib/community/community-contracts";
import { StarRating } from "./StarRating";
import { UserChip } from "./UserChip";

interface ReviewListProps {
  readonly reviews: readonly ReviewResponse[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const t = useTranslations("deck.ratings");

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">{t("noReviews")}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-4 list-none p-0 m-0">
      {reviews.map((review) => {
        return (
          <li key={review.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <UserChip {...review.author} />
              <StarRating value={review.rating} size="sm" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {review.title}
            </p>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
              {review.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
