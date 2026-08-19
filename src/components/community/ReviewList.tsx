"use client";
// Written reviews left on a public deck, newest first.
import { useTranslations } from "next-intl";
import type { DeckReview } from "@/lib/ratings/ratings";
import { StarRating } from "./StarRating";
import { UserChip } from "./UserChip";

export interface ReviewWithAuthor extends DeckReview {
  readonly author: {
    readonly name: string | null;
    readonly username: string | null;
    readonly image: string | null;
  };
}

interface ReviewListProps {
  readonly reviews: readonly ReviewWithAuthor[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const t = useTranslations("deck.ratings");

  if (reviews.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">{t("noReviews")}</p>;
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
            <p className="text-sm font-medium text-[var(--text-primary)]">{review.title}</p>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
              {review.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
