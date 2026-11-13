/**
 * Player badges: the community recognition a public profile shows, as pure
 * rules over a player's counts.
 *
 * Community context. `findPublicProfile` (`public-profile-lookup.ts`) gathers
 * the player's public deck count and the ratings their decks received, derives
 * the counts with {@link countTrendingDecks} and the ratings average, and
 * hands them to {@link getPlayerBadges}; `PlayerBadges` renders the result.
 * No database, no framework: every rule here is a table test.
 *
 * Every threshold below is a product choice. None has a recorded rationale:
 * the feature commit (`17fdcc6c`, 2026-03-30) and `CONTEXT.md` state the
 * values and nothing more, so the comments do not invent one.
 *
 * Not responsible for follows: those are rows of `UserFollow`, written by
 * `/api/community/users/[username]/follow`.
 *
 * @module social/player-badges
 */

/**
 * A badge a public profile can show.
 *
 * `highly_rated` shares its name with the deck `QualityBadge` of the same
 * value (`@/lib/ratings/ratings`) but not its rule: the deck badge needs at
 * least 10 ratings, the player badge has no minimum count. The two are kept
 * apart by type; renaming one is a product decision, not a refactor.
 */
export type PlayerBadge = "community_builder" | "highly_rated" | "trending";

/** What the badge rules read from a player's public decks. */
export interface PlayerStats {
  readonly publicDeckCount: number;
  /** Mean of the ratings the player's public decks received (1 to 5, one decimal), 0 when none. */
  readonly averageRating: number;
  /** Public decks that drew enough recent ratings to count as trending. */
  readonly trendingDecksCount: number;
}

/** A rating as the trending rule reads it: which deck it scored, and when. */
export interface TrendingRatingSample {
  readonly deckId: string;
  readonly createdAt: Date;
}

/** `community_builder` from this many public decks (inclusive). Product value, no recorded reason. */
export const COMMUNITY_BUILDER_MIN_PUBLIC_DECKS = 10;

/**
 * `highly_rated` from this average over every rating of the player's public
 * decks (inclusive), with no minimum number of ratings: one five-star rating
 * earns it. Product value, no recorded reason.
 */
export const HIGHLY_RATED_MIN_AVERAGE = 4.5;

/** `trending` from this many trending decks (inclusive). Product value, no recorded reason. */
export const TRENDING_MIN_TRENDING_DECKS = 5;

/** A deck is trending from this many ratings inside the window (inclusive). Product value, no recorded reason. */
export const TRENDING_MIN_RECENT_RATINGS = 3;

/** The window a trending deck's ratings must fall in, ending now. Product value, no recorded reason. */
export const TRENDING_WINDOW_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Counts the decks that are trending at `now`: each deck with at least
 * {@link TRENDING_MIN_RECENT_RATINGS} ratings in the last
 * {@link TRENDING_WINDOW_DAYS} days. A rating given exactly at the start of
 * the window counts.
 *
 * @param ratings - every rating the player's public decks received, any order
 * @param now - the reference instant, as `Date.now()` gives it
 * @returns the number of distinct trending decks, 0 when `ratings` is empty
 */
export function countTrendingDecks(
  ratings: readonly TrendingRatingSample[],
  now: number
): number {
  const windowStart = now - TRENDING_WINDOW_DAYS * MS_PER_DAY;
  const recentRatingsByDeck = new Map<string, number>();

  for (const rating of ratings) {
    if (rating.createdAt.getTime() < windowStart) continue;
    recentRatingsByDeck.set(
      rating.deckId,
      (recentRatingsByDeck.get(rating.deckId) ?? 0) + 1
    );
  }

  let trending = 0;
  for (const count of recentRatingsByDeck.values()) {
    if (count >= TRENDING_MIN_RECENT_RATINGS) trending += 1;
  }
  return trending;
}

/**
 * The badges a player has earned, in display order: `community_builder`,
 * `highly_rated`, `trending`. Each threshold is inclusive; no badge is the
 * empty list.
 *
 * @param stats - the player's counts, as `findPublicProfile` derives them
 * @returns the earned badges, possibly none
 */
export function getPlayerBadges(stats: PlayerStats): PlayerBadge[] {
  const badges: PlayerBadge[] = [];

  if (stats.publicDeckCount >= COMMUNITY_BUILDER_MIN_PUBLIC_DECKS) {
    badges.push("community_builder");
  }

  if (stats.averageRating >= HIGHLY_RATED_MIN_AVERAGE) {
    badges.push("highly_rated");
  }

  if (stats.trendingDecksCount >= TRENDING_MIN_TRENDING_DECKS) {
    badges.push("trending");
  }

  return badges;
}
