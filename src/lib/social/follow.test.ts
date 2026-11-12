import { describe, it, expect } from "vitest";
import { getPlayerBadges, type PlayerStats } from "./follow";

// ─── Player badges ────────────────────────────────────────────────────────
describe("getPlayerBadges", () => {
  it("awards community_builder badge for 10+ public decks", () => {
    const stats: PlayerStats = { publicDeckCount: 10, averageRating: 3, trendingDecksCount: 0 };
    const badges = getPlayerBadges(stats);
    expect(badges).toContain("community_builder");
  });

  it("awards highly_rated badge for avg rating ≥ 4.5", () => {
    const stats: PlayerStats = { publicDeckCount: 5, averageRating: 4.7, trendingDecksCount: 0 };
    const badges = getPlayerBadges(stats);
    expect(badges).toContain("highly_rated");
  });

  it("awards trending badge for 5+ trending decks", () => {
    const stats: PlayerStats = { publicDeckCount: 5, averageRating: 3, trendingDecksCount: 5 };
    const badges = getPlayerBadges(stats);
    expect(badges).toContain("trending");
  });

  it("returns no badges for new player with no decks", () => {
    const stats: PlayerStats = { publicDeckCount: 0, averageRating: 0, trendingDecksCount: 0 };
    const badges = getPlayerBadges(stats);
    expect(badges).toHaveLength(0);
  });

  it("awards multiple badges when criteria met", () => {
    const stats: PlayerStats = { publicDeckCount: 15, averageRating: 4.8, trendingDecksCount: 6 };
    const badges = getPlayerBadges(stats);
    expect(badges).toHaveLength(3);
  });
});
