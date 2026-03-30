import { describe, it, expect } from "vitest";
import {
  calculateAverageRating,
  buildRatingHistogram,
  getDeckQualityBadge,
  isHighlyRated,
  isLowRated,
  validateReview,
  type DeckRating,
} from "./ratings";

function makeRating(userId: string, rating: number): DeckRating {
  return { id: `r-${userId}`, userId, deckId: "deck-1", rating, createdAt: new Date() };
}

// ─── Average rating ────────────────────────────────────────────────────────
describe("calculateAverageRating", () => {
  it("calculates correct average", () => {
    const ratings = [makeRating("u1", 4), makeRating("u2", 5), makeRating("u3", 3)];
    expect(calculateAverageRating(ratings)).toBeCloseTo(4);
  });

  it("returns 0 for empty ratings", () => {
    expect(calculateAverageRating([])).toBe(0);
  });

  it("rounds to 1 decimal", () => {
    const ratings = [makeRating("u1", 4), makeRating("u2", 3)];
    expect(calculateAverageRating(ratings)).toBe(3.5);
  });
});

// ─── Rating histogram ──────────────────────────────────────────────────────
describe("buildRatingHistogram", () => {
  it("builds histogram with counts per star", () => {
    const ratings = [
      makeRating("u1", 5), makeRating("u2", 5),
      makeRating("u3", 4),
      makeRating("u4", 3),
    ];
    const hist = buildRatingHistogram(ratings);
    expect(hist[5]).toBe(2);
    expect(hist[4]).toBe(1);
    expect(hist[3]).toBe(1);
    expect(hist[2]).toBe(0);
    expect(hist[1]).toBe(0);
  });

  it("initializes all star levels at 0", () => {
    const hist = buildRatingHistogram([]);
    expect(hist[1]).toBe(0);
    expect(hist[5]).toBe(0);
  });
});

// ─── Quality badges ────────────────────────────────────────────────────────
describe("getDeckQualityBadge", () => {
  it("returns highly_rated for avg ≥ 4.5 and ≥ 10 ratings", () => {
    const ratings = Array.from({ length: 10 }, (_, i) => makeRating(`u${i}`, 5));
    expect(getDeckQualityBadge(ratings)).toBe("highly_rated");
  });

  it("returns low_rated for avg < 2.0 and ≥ 5 ratings", () => {
    const ratings = Array.from({ length: 5 }, (_, i) => makeRating(`u${i}`, 1));
    expect(getDeckQualityBadge(ratings)).toBe("low_rated");
  });

  it("returns null when not enough ratings", () => {
    const ratings = [makeRating("u1", 5)];
    expect(getDeckQualityBadge(ratings)).toBeNull();
  });

  it("returns null for mid-range ratings", () => {
    const ratings = Array.from({ length: 10 }, (_, i) => makeRating(`u${i}`, 3));
    expect(getDeckQualityBadge(ratings)).toBeNull();
  });
});

describe("isHighlyRated / isLowRated", () => {
  it("isHighlyRated returns true for 4.5+ avg and 10+ ratings", () => {
    const ratings = Array.from({ length: 10 }, (_, i) => makeRating(`u${i}`, 5));
    expect(isHighlyRated(ratings)).toBe(true);
  });

  it("isHighlyRated returns false for < 10 ratings", () => {
    const ratings = [makeRating("u1", 5)];
    expect(isHighlyRated(ratings)).toBe(false);
  });

  it("isLowRated returns true for < 2.0 avg and 5+ ratings", () => {
    const ratings = Array.from({ length: 5 }, (_, i) => makeRating(`u${i}`, 1));
    expect(isLowRated(ratings)).toBe(true);
  });
});

// ─── Review validation ─────────────────────────────────────────────────────
describe("validateReview", () => {
  it("passes valid review", () => {
    const result = validateReview({ title: "Good deck", body: "I enjoyed it", rating: 4 });
    expect(result.valid).toBe(true);
  });

  it("fails empty title", () => {
    const result = validateReview({ title: "", body: "Good deck", rating: 4 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Title is required");
  });

  it("fails title > 100 chars", () => {
    const result = validateReview({ title: "A".repeat(101), body: "Body", rating: 4 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Title must be under 100 characters");
  });

  it("fails body > 1000 chars", () => {
    const result = validateReview({ title: "Title", body: "A".repeat(1001), rating: 4 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Review must be under 1000 characters");
  });

  it("fails invalid rating (out of 1-5 range)", () => {
    const result = validateReview({ title: "Title", body: "Body", rating: 6 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Rating must be between 1 and 5");
  });

  it("fails empty body", () => {
    const result = validateReview({ title: "Title", body: "", rating: 4 });
    expect(result.valid).toBe(false);
  });
});
