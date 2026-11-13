/**
 * The player badge rules are pure policies over a player's counts, so each
 * threshold is pinned just below, at and above its value. The lookup that
 * gathers the counts is covered by `public-profile-lookup.test.ts`; what a
 * client receives is pinned by `src/app/api/users/[username]/route.test.ts`.
 */
import { describe, expect, it } from "vitest";
import {
  COMMUNITY_BUILDER_MIN_PUBLIC_DECKS,
  countTrendingDecks,
  getPlayerBadges,
  HIGHLY_RATED_MIN_AVERAGE,
  TRENDING_MIN_RECENT_RATINGS,
  TRENDING_MIN_TRENDING_DECKS,
  TRENDING_WINDOW_DAYS,
  type PlayerStats,
  type TrendingRatingSample,
} from "./player-badges";

/** A player who earns nothing: every count sits well below its threshold. */
const NO_BADGE_STATS: PlayerStats = {
  publicDeckCount: 0,
  averageRating: 0,
  trendingDecksCount: 0,
};

describe("getPlayerBadges", () => {
  it.each([
    [COMMUNITY_BUILDER_MIN_PUBLIC_DECKS - 1, false],
    [COMMUNITY_BUILDER_MIN_PUBLIC_DECKS, true],
    [COMMUNITY_BUILDER_MIN_PUBLIC_DECKS + 1, true],
  ])(
    "with %i public decks, awards community_builder: %s",
    (publicDeckCount, awarded) => {
      const badges = getPlayerBadges({ ...NO_BADGE_STATS, publicDeckCount });
      expect(badges.includes("community_builder")).toBe(awarded);
    }
  );

  it.each([
    [HIGHLY_RATED_MIN_AVERAGE - 0.1, false],
    [HIGHLY_RATED_MIN_AVERAGE, true],
    [HIGHLY_RATED_MIN_AVERAGE + 0.1, true],
  ])(
    "with an average rating of %f, awards highly_rated: %s",
    (averageRating, awarded) => {
      const badges = getPlayerBadges({ ...NO_BADGE_STATS, averageRating });
      expect(badges.includes("highly_rated")).toBe(awarded);
    }
  );

  it.each([
    [TRENDING_MIN_TRENDING_DECKS - 1, false],
    [TRENDING_MIN_TRENDING_DECKS, true],
    [TRENDING_MIN_TRENDING_DECKS + 1, true],
  ])(
    "with %i trending decks, awards trending: %s",
    (trendingDecksCount, awarded) => {
      const badges = getPlayerBadges({ ...NO_BADGE_STATS, trendingDecksCount });
      expect(badges.includes("trending")).toBe(awarded);
    }
  );

  it("awards no badge to a new player with no decks", () => {
    expect(getPlayerBadges(NO_BADGE_STATS)).toEqual([]);
  });

  it("lists every earned badge in display order: builder, rated, trending", () => {
    const badges = getPlayerBadges({
      publicDeckCount: COMMUNITY_BUILDER_MIN_PUBLIC_DECKS,
      averageRating: HIGHLY_RATED_MIN_AVERAGE,
      trendingDecksCount: TRENDING_MIN_TRENDING_DECKS,
    });
    expect(badges).toEqual(["community_builder", "highly_rated", "trending"]);
  });
});

describe("countTrendingDecks", () => {
  const NOW = Date.UTC(2026, 10, 13, 12, 0, 0);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const WINDOW_START = NOW - TRENDING_WINDOW_DAYS * MS_PER_DAY;

  function recentRatings(
    deckId: string,
    count: number
  ): readonly TrendingRatingSample[] {
    return Array.from({ length: count }, (_, index) => ({
      deckId,
      createdAt: new Date(NOW - index * MS_PER_DAY),
    }));
  }

  it.each([
    [TRENDING_MIN_RECENT_RATINGS - 1, 0],
    [TRENDING_MIN_RECENT_RATINGS, 1],
    [TRENDING_MIN_RECENT_RATINGS + 1, 1],
  ])(
    "a deck with %i recent ratings counts as %i trending deck",
    (ratingCount, expected) => {
      expect(
        countTrendingDecks(recentRatings("deck-a", ratingCount), NOW)
      ).toBe(expected);
    }
  );

  it("counts each deck on its own ratings, never on the player's total", () => {
    const ratings = [
      ...recentRatings("deck-a", TRENDING_MIN_RECENT_RATINGS),
      ...recentRatings("deck-b", TRENDING_MIN_RECENT_RATINGS - 1),
      ...recentRatings("deck-c", TRENDING_MIN_RECENT_RATINGS),
    ];
    expect(countTrendingDecks(ratings, NOW)).toBe(2);
  });

  it("counts a rating given exactly at the start of the window", () => {
    const ratings = [
      ...recentRatings("deck-a", TRENDING_MIN_RECENT_RATINGS - 1),
      { deckId: "deck-a", createdAt: new Date(WINDOW_START) },
    ];
    expect(countTrendingDecks(ratings, NOW)).toBe(1);
  });

  it("ignores a rating given one millisecond before the window", () => {
    const ratings = [
      ...recentRatings("deck-a", TRENDING_MIN_RECENT_RATINGS - 1),
      { deckId: "deck-a", createdAt: new Date(WINDOW_START - 1) },
    ];
    expect(countTrendingDecks(ratings, NOW)).toBe(0);
  });

  it("counts nothing when the player's decks have no ratings", () => {
    expect(countTrendingDecks([], NOW)).toBe(0);
  });
});
