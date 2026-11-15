/**
 * What voting on a deck and rating it need from the outside: the deck's
 * visibility facts, the stored votes and the stored ratings.
 *
 * Community context, deck interactions. The use cases in
 * `deck-vote-use-cases.ts` and `deck-rating-use-cases.ts` depend on these
 * ports only. `prisma-vote-store.ts`, `prisma-rating-store.ts` and
 * `visible-deck.ts` implement them over Prisma; `deck-interaction-server.ts`
 * wires them. Tests hand the use cases the in-memory fakes of
 * `testing/deck-interaction-fakes.ts` instead (ADR 0005).
 *
 * @module community/deck-interaction-ports
 */
import type { DeckVisibilityFacts } from "@/lib/community/deck-visibility-policy";
import type { DeckVote } from "@/lib/community/votes";
import type { DeckRatingRow } from "@/lib/ratings/mappers";

/** The facts the policies read about one stored deck. */
export interface DeckVisibilityReader {
  /** @returns the deck's visibility facts, or null when no deck has this id */
  readVisibility(deckId: string): Promise<DeckVisibilityFacts | null>;
}

/** One user's vote on one deck, the pair that identifies a stored row. */
export interface VoterOnDeck {
  readonly userId: string;
  readonly deckId: string;
}

/**
 * The stored votes, one row per user and deck.
 *
 * An implementation guarantees:
 * - `listVotes` answers every vote on the deck, in no particular order;
 * - `saveVote` stores the vote, replacing the user's earlier vote on the
 *   deck if any: flipping a vote never stacks a second row;
 * - `removeVote` is idempotent: removing a vote that does not exist is not
 *   an error.
 * Any method rejects with the store's own error when the store fails; the
 * routes turn that into a 500.
 */
export interface VoteStore {
  listVotes(deckId: string): Promise<readonly DeckVote[]>;
  saveVote(vote: DeckVote): Promise<void>;
  removeVote(voter: VoterOnDeck): Promise<void>;
}

/** The author fields the ratings route joins onto each stored rating. */
export interface RatingAuthor {
  readonly name: string | null;
  readonly username: string | null;
  readonly image: string | null;
}

/**
 * A stored rating as the ratings route returns it: the row plus its author.
 * The `user` key is the response shape of `POST .../ratings` (#1363); keep it.
 */
export interface StoredRating extends DeckRatingRow {
  readonly user: RatingAuthor;
}

/**
 * What `rateDeck` stores: the stars, and the review text when the player
 * wrote one. A null `title` marks a star-only rating (`toDeckReview`).
 */
export interface RatingDraft {
  readonly userId: string;
  readonly deckId: string;
  /** 1 to 5, validated by the route's schema before the use case runs. */
  readonly rating: number;
  readonly title: string | null;
  readonly body: string | null;
}

/**
 * The stored ratings, one row per user and deck.
 *
 * An implementation guarantees:
 * - `listRatings` answers every rating on the deck, newest first;
 * - `saveRating` stores the draft, replacing the user's earlier rating on
 *   the deck if any, and answers the stored row with its author;
 * - `removeRating` is idempotent and answers how many rows it removed, 0
 *   or 1.
 * Any method rejects with the store's own error when the store fails; the
 * routes turn that into a 500.
 */
export interface RatingStore {
  listRatings(deckId: string): Promise<readonly StoredRating[]>;
  saveRating(draft: RatingDraft): Promise<StoredRating>;
  removeRating(rater: VoterOnDeck): Promise<number>;
}
