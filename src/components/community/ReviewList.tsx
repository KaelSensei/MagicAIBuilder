"use client";
// Written reviews left on a public deck, newest first.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { User } from "lucide-react";
import type { DeckReview } from "@/lib/ratings/ratings";
import { StarRating } from "./StarRating";

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
        const displayName = review.author.name ?? review.author.username ?? "Anonymous";
        return (
          <li key={review.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {review.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={review.author.image}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-[var(--border)]"
                />
              ) : (
                <span className="w-6 h-6 rounded-full border border-[var(--border)] bg-[var(--background)] flex items-center justify-center">
                  <User className="w-3 h-3 text-[var(--text-secondary)]" aria-hidden="true" />
                </span>
              )}
              {review.author.username ? (
                <Link
                  href={`/u/${review.author.username}`}
                  className="text-sm text-[var(--text-primary)] hover:text-[var(--accent)]"
                >
                  {displayName}
                </Link>
              ) : (
                <span className="text-sm text-[var(--text-primary)]">{displayName}</span>
              )}
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
