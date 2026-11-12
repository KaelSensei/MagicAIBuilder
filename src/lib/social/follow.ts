/**
 * Player badges: the community recognition a public profile shows.
 *
 * Community context, pure functions. `GET /api/users/[username]` gathers the
 * player's public deck count, average rating and trending decks, and
 * `PlayerBadges` renders the result. Follows themselves are rows of the
 * `UserFollow` table, written by `/api/community/users/[username]/follow`;
 * nothing about them is computed here, despite the file name.
 *
 * @module social/follow
 */

/** What the badge rules read from a player's public decks. */
export interface PlayerStats {
  readonly publicDeckCount: number;
  /** Mean of the ratings the player's public decks received (1 to 5, one decimal), 0 when none. */
  readonly averageRating: number;
  /** Public decks that drew enough recent ratings to count as trending. */
  readonly trendingDecksCount: number;
}

/** A badge a public profile can show. */
export type PlayerBadge = "community_builder" | "highly_rated" | "trending";

const BADGE_THRESHOLDS = {
  COMMUNITY_BUILDER_DECKS: 10,
  HIGHLY_RATED_AVG: 4.5,
  TRENDING_DECKS: 5,
} as const;

/**
 * The badges a player has earned, in display order: `community_builder` from
 * 10 public decks, `highly_rated` from an average rating of 4.5, `trending`
 * from 5 trending decks. Each threshold is inclusive; no badge is the empty
 * list.
 */
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
