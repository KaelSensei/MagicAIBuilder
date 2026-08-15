import { describe, it, expect } from "vitest";
import {
  VOTE_VALUES,
  calculateVoteScore,
  isValidVoteValue,
  rankDecksByScore,
  type DeckVote,
  type RankableDeck,
} from "./votes";

function vote(value: number, userId = "u1"): DeckVote {
  return { userId, deckId: "d1", value: value as DeckVote["value"] };
}

describe("isValidVoteValue", () => {
  it("accepts the two vote directions", () => {
    expect(isValidVoteValue(1)).toBe(true);
    expect(isValidVoteValue(-1)).toBe(true);
  });

  it("rejects anything else, including zero", () => {
    for (const bad of [0, 2, -2, 0.5, Number.NaN]) {
      expect(isValidVoteValue(bad)).toBe(false);
    }
  });

  it("exposes the accepted values", () => {
    expect([...VOTE_VALUES].sort((a, b) => a - b)).toEqual([-1, 1]);
  });
});

describe("calculateVoteScore", () => {
  it("is zero with no votes", () => {
    expect(calculateVoteScore([])).toEqual({ score: 0, upvotes: 0, downvotes: 0 });
  });

  it("sums upvotes and downvotes into a net score", () => {
    const votes = [vote(1, "a"), vote(1, "b"), vote(1, "c"), vote(-1, "d")];

    expect(calculateVoteScore(votes)).toEqual({ score: 2, upvotes: 3, downvotes: 1 });
  });

  it("can go negative", () => {
    expect(calculateVoteScore([vote(-1, "a"), vote(-1, "b")]).score).toBe(-2);
  });
});

describe("rankDecksByScore", () => {
  function deck(id: string, score: number, ratingCount = 0, updatedAt = "2026-01-01"): RankableDeck {
    return { id, score, ratingCount, updatedAt: new Date(updatedAt) };
  }

  it("orders by score, highest first", () => {
    const ranked = rankDecksByScore([deck("a", 1), deck("b", 9), deck("c", 5)]);

    expect(ranked.map((d) => d.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks a score tie with the rating count", () => {
    const ranked = rankDecksByScore([deck("a", 5, 1), deck("b", 5, 7)]);

    expect(ranked.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("breaks a full tie with the most recently updated deck", () => {
    const ranked = rankDecksByScore([
      deck("old", 5, 2, "2026-01-01"),
      deck("new", 5, 2, "2026-06-01"),
    ]);

    expect(ranked.map((d) => d.id)).toEqual(["new", "old"]);
  });

  it("does not mutate its input", () => {
    const decks = [deck("a", 1), deck("b", 9)];

    rankDecksByScore(decks);

    expect(decks.map((d) => d.id)).toEqual(["a", "b"]);
  });
});
