/**
 * Deck Ratings & Reviews — Pure functions for rating calculations
 * Zero framework dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────
export interface DeckRating {
  readonly id: string;
  readonly userId: string;
  readonly deckId: string;
  readonly rating: number; // 1–5
  readonly createdAt: Date;
}

export interface DeckReview {
  readonly id: string;
  readonly userId: string;
  readonly deckId: string;
  readonly rating: number; // 1–5
  readonly title: string;
  readonly body: string;
  readonly helpfulCount: number;
  readonly createdAt: Date;
}

export type QualityBadge = "highly_rated" | "low_rated" | null;

export interface RatingHistogram {
  readonly 1: number;
  readonly 2: number;
  readonly 3: number;
  readonly 4: number;
  readonly 5: number;
}

export interface ReviewValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

// ─── Average rating ────────────────────────────────────────────────────────
export function calculateAverageRating(ratings: readonly DeckRating[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

// ─── Histogram ────────────────────────────────────────────────────────────
export function buildRatingHistogram(ratings: readonly DeckRating[]): RatingHistogram {
  const hist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    const star = r.rating as keyof RatingHistogram;
    if (star >= 1 && star <= 5) {
      hist[star] += 1;
    }
  }
  return hist;
}

// ─── Quality badges ────────────────────────────────────────────────────────
const HIGHLY_RATED_MIN_AVG = 4.5;
const HIGHLY_RATED_MIN_COUNT = 10;
const LOW_RATED_MAX_AVG = 2;
const LOW_RATED_MIN_COUNT = 5;

export function isHighlyRated(ratings: readonly DeckRating[]): boolean {
  return (
    ratings.length >= HIGHLY_RATED_MIN_COUNT &&
    calculateAverageRating(ratings) >= HIGHLY_RATED_MIN_AVG
  );
}

export function isLowRated(ratings: readonly DeckRating[]): boolean {
  return (
    ratings.length >= LOW_RATED_MIN_COUNT &&
    calculateAverageRating(ratings) < LOW_RATED_MAX_AVG
  );
}

export function getDeckQualityBadge(ratings: readonly DeckRating[]): QualityBadge {
  if (isHighlyRated(ratings)) return "highly_rated";
  if (isLowRated(ratings)) return "low_rated";
  return null;
}

// ─── Review validation ─────────────────────────────────────────────────────
interface ReviewInput {
  readonly title: string;
  readonly body: string;
  readonly rating: number;
}

export function validateReview(input: ReviewInput): ReviewValidation {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push("Title is required");
  } else if (input.title.length > 100) {
    errors.push("Title must be under 100 characters");
  }

  if (!input.body || input.body.trim().length === 0) {
    errors.push("Review body is required");
  } else if (input.body.length > 1000) {
    errors.push("Review must be under 1000 characters");
  }

  if (input.rating < 1 || input.rating > 5) {
    errors.push("Rating must be between 1 and 5");
  }

  return { valid: errors.length === 0, errors };
}
