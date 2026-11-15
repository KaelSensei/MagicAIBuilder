/**
 * Rating a community deck: read the aggregate and the written reviews, rate
 * or re-rate it with an optional review, remove one's rating.
 *
 * Community context, deck interactions. `/api/community/decks/[id]/ratings`
 * calls these after the session and the body are checked, and maps each
 * outcome to a status; the HTTP concerns stay in the route. The use cases
 * depend on the ports in `deck-interaction-ports.ts` only, so they run in
 * Vitest with in-memory fakes and no database (ADR 0005). The rules are
 * `canActOnDeck` (`deck-interaction-policy.ts`), `canViewDeck`
 * (`deck-visibility-policy.ts`) and the review rules of
 * `@/lib/ratings/ratings`.
 *
 * @module community/deck-rating-use-cases
 */
import { canActOnDeck } from "@/lib/community/deck-interaction-policy";
import type {
  DeckVisibilityReader,
  RatingAuthor,
  RatingStore,
  StoredRating,
} from "@/lib/community/deck-interaction-ports";
import {
  canViewDeck,
  DECK_ACCESS_BY_ID,
} from "@/lib/community/deck-visibility-policy";
import { toDeckRating, toDeckReview } from "@/lib/ratings/mappers";
import {
  buildRatingHistogram,
  calculateAverageRating,
  getDeckQualityBadge,
  validateReview,
  type DeckReview,
  type QualityBadge,
  type RatingHistogram,
} from "@/lib/ratings/ratings";

/** The adapters the rating use cases run on; `deck-interaction-server.ts` passes the real ones. */
export interface RatingUseCasePorts {
  readonly decks: DeckVisibilityReader;
  readonly ratings: RatingStore;
}

/** A written review with the author fields the page displays. */
export interface AuthoredReview extends DeckReview {
  readonly author: RatingAuthor;
}

/** What `GET .../ratings` answers: the aggregate, the written reviews, the viewer's stars. */
export interface DeckRatingsSummary {
  readonly average: number;
  readonly count: number;
  readonly histogram: RatingHistogram;
  readonly badge: QualityBadge;
  readonly reviews: readonly AuthoredReview[];
  /** The viewer's own stars, null when they have not rated or are signed out. */
  readonly viewerRating: number | null;
}

/** A summary answered to someone who may see the deck, or a deck they may not see. */
export type DeckRatingsResult =
  | { readonly kind: "ok"; readonly summary: DeckRatingsSummary }
  | { readonly kind: "not-found" };

/**
 * The outcome of {@link rateDeck}:
 * - `ok`: the rating is stored; `rating` is the stored row with its author;
 * - `invalid`: the written review breaks a review rule; `errors` are the
 *   rule messages of `validateReview`;
 * - `not-found`: no deck has this id, or the rater may not see it (a private
 *   deck answers as a missing one);
 * - `own-deck`: the rater owns the deck.
 */
export type RateDeckResult =
  | { readonly kind: "ok"; readonly rating: StoredRating }
  | { readonly kind: "invalid"; readonly errors: readonly string[] }
  | { readonly kind: "not-found" }
  | { readonly kind: "own-deck" };

/** Who asks for a deck's ratings. */
export interface ReadDeckRatingsQuery {
  readonly deckId: string;
  /** The signed-in viewer, or null when signed out. */
  readonly viewerId: string | null;
}

/**
 * One rating to store. `title` and `body` are both absent for a star-only
 * rating; when either is present the pair is a written review and must pass
 * the review rules.
 */
export interface RateDeckCommand {
  readonly deckId: string;
  readonly raterId: string;
  /** 1 to 5, validated by the route's schema before the use case runs. */
  readonly rating: number;
  readonly title?: string;
  readonly body?: string;
}

/** The rating to remove; removing a rating that does not exist is not an error. */
export interface RemoveRatingCommand {
  readonly deckId: string;
  readonly raterId: string;
}

function summarize(
  rows: readonly StoredRating[],
  viewerId: string | null
): DeckRatingsSummary {
  const ratings = rows.map(toDeckRating);
  const reviews = rows.flatMap((row) => {
    const review = toDeckReview(row);
    return review ? [{ ...review, author: row.user }] : [];
  });
  return {
    average: calculateAverageRating(ratings),
    count: ratings.length,
    histogram: buildRatingHistogram(ratings),
    badge: getDeckQualityBadge(ratings),
    reviews,
    viewerRating:
      ratings.find((rating) => rating.userId === viewerId)?.rating ?? null,
  };
}

/**
 * The ratings of a deck the viewer may see: aggregate, written reviews
 * newest first, and the viewer's own stars.
 *
 * A deck the viewer may not see is not read at all, so nothing about a
 * private deck leaks through a count.
 */
export async function readDeckRatings(
  { deckId, viewerId }: ReadDeckRatingsQuery,
  ports: RatingUseCasePorts
): Promise<DeckRatingsResult> {
  const deck = await ports.decks.readVisibility(deckId);
  if (!deck || !canViewDeck(deck, viewerId, DECK_ACCESS_BY_ID).allowed) {
    return { kind: "not-found" };
  }
  return {
    kind: "ok",
    summary: summarize(await ports.ratings.listRatings(deckId), viewerId),
  };
}

/**
 * Stores the rater's rating, replacing their earlier one on the deck.
 *
 * The review rules are checked before the deck is read, as the route did: a
 * bad review is refused whether or not the deck exists. A written review is
 * one where `title` or `body` is given; a bare star has no text to check.
 * The rating is stored only when `canActOnDeck` allows it: the rater must be
 * able to see the deck and must not own it.
 */
export async function rateDeck(
  { deckId, raterId, rating, title, body }: RateDeckCommand,
  ports: RatingUseCasePorts
): Promise<RateDeckResult> {
  const isReview = title !== undefined || body !== undefined;
  if (isReview) {
    const validation = validateReview({
      title: title ?? "",
      body: body ?? "",
      rating,
    });
    if (!validation.valid)
      return { kind: "invalid", errors: validation.errors };
  }

  const deck = await ports.decks.readVisibility(deckId);
  if (!deck) return { kind: "not-found" };

  const decision = canActOnDeck(deck, raterId);
  if (!decision.allowed) {
    return { kind: decision.reason === "own-deck" ? "own-deck" : "not-found" };
  }

  const saved = await ports.ratings.saveRating({
    userId: raterId,
    deckId,
    rating,
    title: title ?? null,
    body: body ?? null,
  });
  return { kind: "ok", rating: saved };
}

/**
 * Removes the rater's rating and answers how many rows went: 1, or 0 when
 * they had not rated.
 *
 * The deck is not read: the route never checked it for a removal, so a
 * rating on a deck that has since gone private can still be withdrawn.
 */
export async function removeRating(
  { deckId, raterId }: RemoveRatingCommand,
  ports: RatingUseCasePorts
): Promise<{ readonly deleted: number }> {
  return {
    deleted: await ports.ratings.removeRating({ userId: raterId, deckId }),
  };
}
