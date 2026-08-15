/**
 * Community deck votes.
 *
 * This is a second, coarser quality signal alongside the 1–5 star ratings in
 * `src/lib/ratings/`. Stars answer "how good is this deck"; a vote answers
 * "should this deck be near the top of the list". Discovery ranking uses the
 * vote score, and the star average stays the per-deck quality read.
 *
 * @module community/votes
 */

/** The only two directions a vote may take. */
export const VOTE_VALUES = [1, -1] as const;

/** A single vote's direction. */
export type VoteValue = (typeof VOTE_VALUES)[number];

/** One user's vote on one deck. */
export interface DeckVote {
  readonly userId: string;
  readonly deckId: string;
  readonly value: VoteValue;
}

/** Aggregated vote tally for a deck. */
export interface VoteTally {
  /** Upvotes minus downvotes; may be negative */
  readonly score: number;
  readonly upvotes: number;
  readonly downvotes: number;
}

/** The fields discovery ranking needs from a deck. */
export interface RankableDeck {
  readonly id: string;
  readonly score: number;
  readonly ratingCount: number;
  readonly updatedAt: Date;
}

/**
 * Type guard for request bodies.
 *
 * Zero is rejected deliberately: clearing a vote is a DELETE, not a vote of
 * value 0, so a stored row always represents a real opinion.
 *
 * @param value - candidate vote value
 * @returns whether it is one of the accepted directions
 */
export function isValidVoteValue(value: number): value is VoteValue {
  return (VOTE_VALUES as readonly number[]).includes(value);
}

/**
 * Tallies a deck's votes.
 *
 * @param votes - every vote cast on the deck
 * @returns net score plus the two raw counts
 */
export function calculateVoteScore(votes: readonly DeckVote[]): VoteTally {
  let upvotes = 0;
  let downvotes = 0;

  for (const vote of votes) {
    if (vote.value === 1) upvotes++;
    else downvotes++;
  }

  return { score: upvotes - downvotes, upvotes, downvotes };
}

/**
 * Orders decks for the discovery listing.
 *
 * Score first. Ties break on how many people rated the deck — a deck with more
 * ratings has more evidence behind the same score — and then on recency, so a
 * brand-new list is not permanently stuck below an identical older one.
 *
 * @param decks - decks to order
 * @returns a new array, highest first; the input is left untouched
 */
export function rankDecksByScore<T extends RankableDeck>(decks: readonly T[]): readonly T[] {
  return [...decks].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.ratingCount !== b.ratingCount) return b.ratingCount - a.ratingCount;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}
