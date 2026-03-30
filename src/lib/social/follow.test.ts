import { describe, it, expect } from "vitest";
import {
  addFollow,
  removeFollow,
  isFollowing,
  getFollowerCount,
  getFollowingCount,
  getPlayerBadges,
  type UserFollow,
  type PlayerStats,
} from "./follow";

function makeFollow(followerId: string, followingId: string): UserFollow {
  return { id: `f-${followerId}-${followingId}`, followerId, followingId, createdAt: new Date() };
}

// ─── Follow / unfollow ────────────────────────────────────────────────────
describe("addFollow", () => {
  it("adds a follow relationship", () => {
    const follows: UserFollow[] = [];
    const result = addFollow(follows, "user1", "user2");
    expect(result).toHaveLength(1);
    expect(result[0].followerId).toBe("user1");
    expect(result[0].followingId).toBe("user2");
  });

  it("does not add duplicate follows", () => {
    const follows = [makeFollow("user1", "user2")];
    const result = addFollow(follows, "user1", "user2");
    expect(result).toHaveLength(1);
  });

  it("does not allow self-follow", () => {
    const follows: UserFollow[] = [];
    const result = addFollow(follows, "user1", "user1");
    expect(result).toHaveLength(0);
  });
});

describe("removeFollow", () => {
  it("removes a follow relationship", () => {
    const follows = [makeFollow("user1", "user2"), makeFollow("user1", "user3")];
    const result = removeFollow(follows, "user1", "user2");
    expect(result).toHaveLength(1);
    expect(result[0].followingId).toBe("user3");
  });

  it("returns unchanged list if follow not found", () => {
    const follows = [makeFollow("user1", "user2")];
    const result = removeFollow(follows, "user1", "nonexistent");
    expect(result).toHaveLength(1);
  });
});

describe("isFollowing", () => {
  it("returns true if following", () => {
    const follows = [makeFollow("user1", "user2")];
    expect(isFollowing(follows, "user1", "user2")).toBe(true);
  });

  it("returns false if not following", () => {
    const follows = [makeFollow("user1", "user2")];
    expect(isFollowing(follows, "user1", "user3")).toBe(false);
  });
});

describe("getFollowerCount / getFollowingCount", () => {
  it("counts followers correctly", () => {
    const follows = [makeFollow("user1", "user3"), makeFollow("user2", "user3")];
    expect(getFollowerCount(follows, "user3")).toBe(2);
  });

  it("counts following correctly", () => {
    const follows = [makeFollow("user1", "user2"), makeFollow("user1", "user3")];
    expect(getFollowingCount(follows, "user1")).toBe(2);
  });
});

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
