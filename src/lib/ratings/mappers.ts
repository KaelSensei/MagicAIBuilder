/**
 * Maps DeckRating rows from Prisma onto the pure-domain shapes in `ratings.ts`,
 * so the scoring functions stay free of any persistence concern.
 *
 * A row is a plain rating; a row that also carries a title is a written review.
 */

import type { DeckRating, DeckReview } from "./ratings";

/** The subset of the Prisma `DeckRating` row these mappers need. */
export interface DeckRatingRow {
  readonly id: string;
  readonly userId: string;
  readonly deckId: string;
  readonly rating: number;
  readonly title: string | null;
  readonly body: string | null;
  readonly helpfulCount: number;
  readonly createdAt: Date;
}

/**
 * Narrows a persisted row to the star-vote shape used for averages and histograms.
 *
 * @param row Persisted rating row.
 * @returns The domain rating.
 */
export function toDeckRating(row: DeckRatingRow): DeckRating {
  return {
    id: row.id,
    userId: row.userId,
    deckId: row.deckId,
    rating: row.rating,
    createdAt: row.createdAt,
  };
}

/**
 * Converts a persisted row to the written-review shape.
 *
 * @param row Persisted rating row carrying review text.
 * @returns The domain review, or null when the row has no written review.
 */
export function toDeckReview(row: DeckRatingRow): DeckReview | null {
  if (row.title === null) return null;

  return {
    id: row.id,
    userId: row.userId,
    deckId: row.deckId,
    rating: row.rating,
    title: row.title,
    body: row.body ?? "",
    helpfulCount: row.helpfulCount,
    createdAt: row.createdAt,
  };
}

/**
 * Extracts every written review from a set of rating rows, preserving order.
 *
 * @param rows Persisted rating rows.
 * @returns Only the rows that carry a written review.
 */
export function toDeckReviews(rows: readonly DeckRatingRow[]): DeckReview[] {
  const reviews: DeckReview[] = [];
  for (const row of rows) {
    const review = toDeckReview(row);
    if (review !== null) reviews.push(review);
  }
  return reviews;
}
