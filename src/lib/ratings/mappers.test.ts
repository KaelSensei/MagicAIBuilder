import { describe, it, expect } from "vitest";
import { toDeckRating, toDeckReview, toDeckReviews, type DeckRatingRow } from "./mappers";

const BASE_ROW: DeckRatingRow = {
  id: "r-1",
  userId: "u-1",
  deckId: "d-1",
  rating: 4,
  title: null,
  body: null,
  helpfulCount: 0,
  createdAt: new Date("2026-08-14T00:00:00Z"),
};

describe("toDeckRating", () => {
  it("keeps only the star-vote fields", () => {
    const row: DeckRatingRow = { ...BASE_ROW, title: "Great", body: "Solid list" };
    expect(toDeckRating(row)).toEqual({
      id: "r-1",
      userId: "u-1",
      deckId: "d-1",
      rating: 4,
      createdAt: BASE_ROW.createdAt,
    });
  });
});

describe("toDeckReview", () => {
  it("returns null when the row has no title", () => {
    expect(toDeckReview(BASE_ROW)).toBeNull();
  });

  it("maps a titled row to a review", () => {
    const row: DeckRatingRow = {
      ...BASE_ROW,
      title: "Great deck",
      body: "Strong ramp package",
      helpfulCount: 3,
    };
    expect(toDeckReview(row)).toEqual({
      id: "r-1",
      userId: "u-1",
      deckId: "d-1",
      rating: 4,
      title: "Great deck",
      body: "Strong ramp package",
      helpfulCount: 3,
      createdAt: BASE_ROW.createdAt,
    });
  });

  it("defaults a null body to an empty string", () => {
    const row: DeckRatingRow = { ...BASE_ROW, title: "Title only", body: null };
    expect(toDeckReview(row)?.body).toBe("");
  });
});

describe("toDeckReviews", () => {
  it("keeps only titled rows and preserves order", () => {
    const rows: DeckRatingRow[] = [
      { ...BASE_ROW, id: "r-1", title: "First" },
      { ...BASE_ROW, id: "r-2", title: null },
      { ...BASE_ROW, id: "r-3", title: "Second" },
    ];
    expect(toDeckReviews(rows).map((r) => r.id)).toEqual(["r-1", "r-3"]);
  });

  it("returns an empty array when no row has a review", () => {
    expect(toDeckReviews([BASE_ROW])).toEqual([]);
  });
});
