/**
 * In-memory fakes of the deck interaction ports, for the vote and rating
 * use-case tests (ADR 0005: owned ports get a hand-written fake).
 *
 * Community context, deck interactions. Each fake keeps the guarantees its
 * port states in `deck-interaction-ports.ts`: one vote or rating per user and
 * deck, idempotent removal, ratings newest first. A test seeds the decks and
 * rows it needs and reads the maps back for its assertions.
 *
 * @module community/testing/deck-interaction-fakes
 */
import type {
  DeckVisibilityReader,
  RatingAuthor,
  RatingStore,
  StoredRating,
  VoteStore,
  VoterOnDeck,
} from "@/lib/community/deck-interaction-ports";
import type { DeckVisibilityFacts } from "@/lib/community/deck-visibility-policy";
import type { DeckVote } from "@/lib/community/votes";

/** The one string a vote or rating is keyed on: its user and its deck. */
export function voterKey({ userId, deckId }: VoterOnDeck): string {
  return `${deckId}:${userId}`;
}

/** A reader over the given decks, keyed by id; any other id reads as null. */
export function inMemoryDeckVisibilityReader(
  decks: Readonly<Record<string, DeckVisibilityFacts>>
): DeckVisibilityReader {
  return {
    readVisibility: (deckId) => Promise.resolve(decks[deckId] ?? null),
  };
}

/** The vote fake, with its rows exposed for seeding and assertions. */
export interface InMemoryVoteStore extends VoteStore {
  readonly rows: Map<string, DeckVote>;
}

/** @returns a new, empty vote store, independent of every other */
export function inMemoryVoteStore(
  seed: readonly DeckVote[] = []
): InMemoryVoteStore {
  const rows = new Map(seed.map((vote) => [voterKey(vote), vote]));
  return {
    rows,
    listVotes: (deckId) =>
      Promise.resolve(
        [...rows.values()].filter((vote) => vote.deckId === deckId)
      ),
    saveVote: (vote) => {
      rows.set(voterKey(vote), vote);
      return Promise.resolve();
    },
    removeVote: (voter) => {
      rows.delete(voterKey(voter));
      return Promise.resolve();
    },
  };
}

/** The author every fake rating carries, unless a seeded row says otherwise. */
export const FAKE_AUTHOR: RatingAuthor = {
  name: "Voter",
  username: "voter",
  image: null,
};

/** The rating fake, with its rows exposed for seeding and assertions. */
export interface InMemoryRatingStore extends RatingStore {
  readonly rows: Map<string, StoredRating>;
}

/**
 * @returns a new rating store holding `seed`, independent of every other.
 *   Saved rows get an id of the form `rating-<n>` and `createdAt` one
 *   millisecond after the previous save, so "newest first" is observable.
 */
export function inMemoryRatingStore(
  seed: readonly StoredRating[] = []
): InMemoryRatingStore {
  const rows = new Map(seed.map((rating) => [voterKey(rating), rating]));
  let nextId = 1;
  let lastCreatedAt = new Date("2026-08-14T00:00:00.000Z");
  return {
    rows,
    listRatings: (deckId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((rating) => rating.deckId === deckId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      ),
    saveRating: (draft) => {
      const earlier = rows.get(voterKey(draft));
      lastCreatedAt = new Date(lastCreatedAt.getTime() + 1);
      const stored: StoredRating = {
        id: earlier?.id ?? `rating-${nextId++}`,
        userId: draft.userId,
        deckId: draft.deckId,
        rating: draft.rating,
        title: draft.title,
        body: draft.body,
        helpfulCount: earlier?.helpfulCount ?? 0,
        createdAt: earlier?.createdAt ?? lastCreatedAt,
        user: earlier?.user ?? FAKE_AUTHOR,
      };
      rows.set(voterKey(draft), stored);
      return Promise.resolve(stored);
    },
    removeRating: (rater) =>
      Promise.resolve(rows.delete(voterKey(rater)) ? 1 : 0),
  };
}
