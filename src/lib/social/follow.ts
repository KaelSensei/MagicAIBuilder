/**
 * Social Follow System — Pure functions for follow/unfollow and player badges
 * Zero framework dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────
export interface UserFollow {
  readonly id: string;
  readonly followerId: string;
  readonly followingId: string;
  readonly createdAt: Date;
}

export interface PlayerStats {
  readonly publicDeckCount: number;
  readonly averageRating: number;
  readonly trendingDecksCount: number;
}

export type PlayerBadge = "community_builder" | "highly_rated" | "trending";

// ─── Follow / unfollow ─────────────────────────────────────────────────────
export function addFollow(
  follows: readonly UserFollow[],
  followerId: string,
  followingId: string
): UserFollow[] {
  // Prevent self-follow
  if (followerId === followingId) return [...follows];

  // Prevent duplicates
  if (follows.some((f) => f.followerId === followerId && f.followingId === followingId)) {
    return [...follows];
  }

  const newFollow: UserFollow = {
    id: `f-${followerId}-${followingId}-${Date.now()}`,
    followerId,
    followingId,
    createdAt: new Date(),
  };

  return [...follows, newFollow];
}

export function removeFollow(
  follows: readonly UserFollow[],
  followerId: string,
  followingId: string
): UserFollow[] {
  return follows.filter(
    (f) => !(f.followerId === followerId && f.followingId === followingId)
  );
}

export function isFollowing(
  follows: readonly UserFollow[],
  followerId: string,
  followingId: string
): boolean {
  return follows.some((f) => f.followerId === followerId && f.followingId === followingId);
}

// ─── Counts ───────────────────────────────────────────────────────────────
export function getFollowerCount(
  follows: readonly UserFollow[],
  userId: string
): number {
  return follows.filter((f) => f.followingId === userId).length;
}

export function getFollowingCount(
  follows: readonly UserFollow[],
  userId: string
): number {
  return follows.filter((f) => f.followerId === userId).length;
}

// ─── Player badges ─────────────────────────────────────────────────────────
const BADGE_THRESHOLDS = {
  COMMUNITY_BUILDER_DECKS: 10,
  HIGHLY_RATED_AVG: 4.5,
  TRENDING_DECKS: 5,
} as const;

export function getPlayerBadges(stats: PlayerStats): PlayerBadge[] {
  const badges: PlayerBadge[] = [];

  if (stats.publicDeckCount >= BADGE_THRESHOLDS.COMMUNITY_BUILDER_DECKS) {
    badges.push("community_builder");
  }

  if (stats.averageRating >= BADGE_THRESHOLDS.HIGHLY_RATED_AVG) {
    badges.push("highly_rated");
  }

  if (stats.trendingDecksCount >= BADGE_THRESHOLDS.TRENDING_DECKS) {
    badges.push("trending");
  }

  return badges;
}
