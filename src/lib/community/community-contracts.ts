/**
 * The wire contracts of the community API routes under `/api/community`, as
 * the browser sends and reads them: the request bodies and the answers of the
 * vote, follow, rating, comment, save, report and saved-deck-folder routes.
 *
 * Community context (client side). `community-client.ts` sends the requests
 * and checks every answer with the guards below before a component sees it,
 * so a route that changes shape fails at the boundary and not deep in a
 * render. The routes build these shapes in `src/app/api/community/**`; a
 * route may send more fields than its contract names (ids, dates, counts the
 * pages do not render), and a guard checks only what the contract promises.
 * Not responsible for: the domain types themselves, which stay in
 * `comments.ts`, `votes.ts`, `deck-folders.ts` and `lib/ratings/ratings.ts`.
 *
 * @module community/community-contracts
 */
import { isRecord } from "@/lib/guards";
import type { DeckComment, DeckCommentThread } from "@/lib/community/comments";
import { isValidVoteValue, type VoteValue } from "@/lib/community/votes";
import type { SavedDeckFoldersResponse } from "@/lib/community/deck-folders";
import type { QualityBadge, RatingHistogram } from "@/lib/ratings/ratings";

/** Narrows an untrusted answer body to one contract. */
export type AnswerGuard<T> = (value: unknown) => value is T;

// ─── Votes ────────────────────────────────────────────────────────────────────

/** Body of `POST /api/community/decks/[id]/vote`. */
export interface VoteRequest {
  readonly value: VoteValue;
}

/**
 * The tally the vote route answers after a read, a cast or a clear: the net
 * score and the direction the viewer holds now, `null` once cleared. The
 * route also sends the raw up and down counts; no page renders them.
 */
export interface VoteTallyResponse {
  readonly score: number;
  readonly viewerVote: VoteValue | null;
}

/** Whether a body is a {@link VoteTallyResponse}. */
export function isVoteTallyResponse(
  value: unknown
): value is VoteTallyResponse {
  return (
    isRecord(value) &&
    typeof value.score === "number" &&
    (value.viewerVote === null ||
      (typeof value.viewerVote === "number" &&
        isValidVoteValue(value.viewerVote)))
  );
}

// ─── Follows ──────────────────────────────────────────────────────────────────

/** What the follow route answers after a follow or an unfollow. */
export interface FollowResponse {
  readonly following: boolean;
  /** How many users follow the profile after the write. */
  readonly followerCount: number;
}

/** Whether a body is a {@link FollowResponse}. */
export function isFollowResponse(value: unknown): value is FollowResponse {
  return (
    isRecord(value) &&
    typeof value.following === "boolean" &&
    typeof value.followerCount === "number"
  );
}

// ─── Ratings and reviews ──────────────────────────────────────────────────────

/**
 * Body of `POST /api/community/decks/[id]/ratings`. A bare star sends the
 * rating alone; a written review adds a title and a body, which the route
 * validates with the review rules (`lib/ratings/ratings.ts`).
 */
export interface RatingRequest {
  /** Whole stars, 1 to 5. */
  readonly rating: number;
  readonly title?: string;
  readonly body?: string;
}

/** Who wrote a review or a comment, as the pages show them. */
export interface CommunityAuthor {
  readonly name: string | null;
  readonly username: string | null;
  readonly image: string | null;
}

/**
 * A written review as the ratings aggregate serves it. The route also sends
 * the reviewer's id, the deck id, the helpful count and the date; the review
 * list renders none of them, so the contract leaves them out.
 */
export interface ReviewResponse {
  readonly id: string;
  /** Whole stars, 1 to 5. */
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly author: CommunityAuthor;
}

/** What `GET /api/community/decks/[id]/ratings` answers. */
export interface DeckRatingsResponse {
  /** Mean of the stars, one decimal; 0 when nobody has rated the deck. */
  readonly average: number;
  readonly count: number;
  readonly histogram: RatingHistogram;
  readonly badge: QualityBadge;
  readonly reviews: readonly ReviewResponse[];
  /** The stars the viewer gave, `null` for a visitor or a viewer who has not rated. */
  readonly viewerRating: number | null;
}

/**
 * The caller's rating as the route saved it. The route answers the whole
 * row; the client promises the fields a page could echo back.
 */
export interface SavedRatingResponse {
  readonly id: string;
  readonly rating: number;
  readonly title: string | null;
  readonly body: string | null;
}

function isCommunityAuthor(value: unknown): value is CommunityAuthor {
  return (
    isRecord(value) &&
    isStringOrNull(value.name) &&
    isStringOrNull(value.username) &&
    isStringOrNull(value.image)
  );
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isReviewResponse(value: unknown): value is ReviewResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.rating === "number" &&
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    isCommunityAuthor(value.author)
  );
}

const HISTOGRAM_STARS = [1, 2, 3, 4, 5] as const;

function isRatingHistogram(value: unknown): value is RatingHistogram {
  return (
    isRecord(value) &&
    HISTOGRAM_STARS.every((star) => typeof value[star] === "number")
  );
}

function isQualityBadge(value: unknown): value is QualityBadge {
  return value === null || value === "highly_rated" || value === "low_rated";
}

/** Whether a body is a {@link DeckRatingsResponse}. */
export function isDeckRatingsResponse(
  value: unknown
): value is DeckRatingsResponse {
  return (
    isRecord(value) &&
    typeof value.average === "number" &&
    typeof value.count === "number" &&
    isRatingHistogram(value.histogram) &&
    isQualityBadge(value.badge) &&
    Array.isArray(value.reviews) &&
    value.reviews.every(isReviewResponse) &&
    (value.viewerRating === null || typeof value.viewerRating === "number")
  );
}

/** Whether a body is a {@link SavedRatingResponse}. */
export function isSavedRatingResponse(
  value: unknown
): value is SavedRatingResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.rating === "number" &&
    isStringOrNull(value.title) &&
    isStringOrNull(value.body)
  );
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * Body of `POST /api/community/decks/[id]/comments`. A reply names the comment
 * it answers; the route refuses a parent that belongs to another deck.
 */
export interface CommentRequest {
  readonly body: string;
  readonly parentId?: string;
}

/** Body of `PATCH /api/community/decks/[id]/comments/[commentId]`. */
export interface CommentEditRequest {
  readonly body: string;
}

/** What `GET /api/community/decks/[id]/comments` answers: the threads, newest first, and how many comments they hold. */
export interface DeckCommentsResponse {
  readonly comments: readonly DeckCommentThread[];
  readonly count: number;
}

/** Whether a body is one comment as the route serves it (`comment-mappers.ts`). */
export function isDeckComment(value: unknown): value is DeckComment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.deckId === "string" &&
    isStringOrNull(value.parentId) &&
    typeof value.body === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isCommunityAuthor(value.author) &&
    typeof value.isDeckOwner === "boolean" &&
    typeof value.isAuthor === "boolean"
  );
}

/** Whether a body is a comment with its replies resolved, replies checked all the way down. */
export function isDeckCommentThread(
  value: unknown
): value is DeckCommentThread {
  return (
    isDeckComment(value) &&
    "replies" in value &&
    Array.isArray(value.replies) &&
    value.replies.every(isDeckCommentThread)
  );
}

/** Whether a body is a {@link DeckCommentsResponse}. */
export function isDeckCommentsResponse(
  value: unknown
): value is DeckCommentsResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.comments) &&
    value.comments.every(isDeckCommentThread) &&
    typeof value.count === "number"
  );
}

// ─── Saved decks and folders ──────────────────────────────────────────────────

/** Body of `POST /api/community/decks/[id]/save`; `null` files the deck as unfiled. */
export interface SaveDeckRequest {
  readonly folderId: string | null;
}

/** What the save route answers: the bookmark exists, in that folder. */
export interface SaveDeckResponse {
  readonly saved: true;
  readonly folderId: string | null;
}

/** Whether a body is a {@link SaveDeckResponse}. */
export function isSaveDeckResponse(value: unknown): value is SaveDeckResponse {
  return (
    isRecord(value) && value.saved === true && isStringOrNull(value.folderId)
  );
}

/** Body of the folder create and rename routes. The route trims the name and takes 1 to 80 characters. */
export interface FolderRequest {
  readonly name: string;
}

/** A folder as the create and rename routes answer it. */
export interface FolderResponse {
  readonly id: string;
  readonly name: string;
}

/** Whether a body is a {@link FolderResponse}. */
export function isFolderResponse(value: unknown): value is FolderResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

/**
 * Whether a body is the saved-deck library (`GET /api/community/deck-folders`):
 * a record with a `folders` list and an `unfiled` list. Each entry is then
 * read by `readSavedDeckFolders` (`deck-folders.ts`), which drops an entry it
 * cannot read instead of refusing the whole library, as the pages did before
 * the client.
 */
export function isSavedDeckLibraryBody(
  value: unknown
): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    Array.isArray(value.folders) &&
    Array.isArray(value.unfiled)
  );
}

export type { SavedDeckFoldersResponse };

// ─── Reports ──────────────────────────────────────────────────────────────────

/** The reasons a player may report a public deck for; the route's enum. */
export const REPORT_REASONS = [
  "spam",
  "harassment",
  "illegal_content",
  "other",
] as const;

/** One of {@link REPORT_REASONS}. */
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Body of `POST /api/community/decks/[id]/reports`. */
export interface ReportRequest {
  readonly reason: ReportReason;
}

/**
 * Where the caller's report stands: `pending` while it waits for a moderator,
 * `closed` when a moderator already ruled on an earlier report of theirs, which
 * a new report does not reopen.
 */
export interface ReportResponse {
  readonly status: "pending" | "closed";
}

/** Whether a body is a {@link ReportResponse}. */
export function isReportResponse(value: unknown): value is ReportResponse {
  return (
    isRecord(value) && (value.status === "pending" || value.status === "closed")
  );
}
