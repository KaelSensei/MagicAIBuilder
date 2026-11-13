/**
 * HTTP client for the community API routes, as the public deck and profile
 * pages call them: votes, follows, ratings and reviews, comments, saved decks
 * and their folders, and reports.
 *
 * Community context (client side). One function per route and method. Each
 * sends the request the component used to send by hand, then either answers
 * the data the route's contract promises (`community-contracts.ts`), checked
 * by that contract's guard, or throws: a {@link CommunityApiError} for a
 * refusal, a {@link MalformedCommunityAnswerError} for a 2xx whose body the
 * guard refuses (`community-request.ts` does the sending and the checking).
 * A network failure or a timeout rejects with the browser's own error, as
 * `fetch` does. Not responsible for: retries, optimistic state and messages
 * for the player, which stay in the components and their hooks.
 *
 * @module community/community-client
 */
import {
  isDeckCommentsResponse,
  isDeckComment,
  isDeckRatingsResponse,
  isFollowResponse,
  isFolderResponse,
  isReportResponse,
  isSaveDeckResponse,
  isSavedDeckLibraryBody,
  isSavedRatingResponse,
  isVoteTallyResponse,
  type CommentEditRequest,
  type CommentRequest,
  type DeckCommentsResponse,
  type DeckRatingsResponse,
  type FollowResponse,
  type FolderRequest,
  type FolderResponse,
  type RatingRequest,
  type ReportReason,
  type ReportRequest,
  type ReportResponse,
  type SaveDeckRequest,
  type SaveDeckResponse,
  type SavedDeckFoldersResponse,
  type SavedRatingResponse,
  type VoteRequest,
  type VoteTallyResponse,
} from "@/lib/community/community-contracts";
import {
  jsonInit,
  send,
  sendForStatus,
} from "@/lib/community/community-request";
import { readSavedDeckFolders } from "@/lib/community/deck-folders";
import type { DeckComment } from "@/lib/community/comments";
import type { VoteValue } from "@/lib/community/votes";

export {
  CommunityApiError,
  MalformedCommunityAnswerError,
} from "@/lib/community/community-client-errors";

/**
 * How long a public read (the ratings aggregate, the comment stream) may keep
 * a page waiting, in milliseconds, before it is aborted and rejects with a
 * `TimeoutError`. The panels that render those reads show "could not load"
 * and a retry button on any rejection; without a bound, a read that never
 * answered left them loading forever. The same budget as the deck client's
 * reads. Writes carry no timeout, as before the client.
 */
export const COMMUNITY_READ_TIMEOUT_MS = 15_000;

const COMMUNITY_API = "/api/community";

function deckRoute(deckId: string, resource: string): string {
  return `${COMMUNITY_API}/decks/${encodeURIComponent(deckId)}/${resource}`;
}

function folderRoute(folderId: string): string {
  return `${COMMUNITY_API}/deck-folders/${encodeURIComponent(folderId)}`;
}

// ─── Votes ────────────────────────────────────────────────────────────────────

/**
 * Casts or changes the viewer's vote on a public deck.
 *
 * @returns the deck's tally after the write
 * @throws CommunityApiError 400 for a value other than 1 or -1, 401 signed
 *   out, 403 on the viewer's own deck, 404 for a deck they cannot see
 */
export function castVote(
  deckId: string,
  value: VoteValue
): Promise<VoteTallyResponse> {
  const body: VoteRequest = { value };
  return send({
    operation: "castVote",
    url: deckRoute(deckId, "vote"),
    init: jsonInit("POST", body),
    guard: isVoteTallyResponse,
  });
}

/**
 * Clears the viewer's vote on a public deck. Clearing a vote that does not
 * exist is not a failure: the route answers the unchanged tally.
 *
 * @returns the deck's tally after the write
 * @throws CommunityApiError 401 signed out, 404 for a deck the viewer cannot see
 */
export function clearVote(deckId: string): Promise<VoteTallyResponse> {
  return send({
    operation: "clearVote",
    url: deckRoute(deckId, "vote"),
    init: { method: "DELETE" },
    guard: isVoteTallyResponse,
  });
}

// ─── Follows ──────────────────────────────────────────────────────────────────

function followRoute(username: string): string {
  return `${COMMUNITY_API}/users/${encodeURIComponent(username)}/follow`;
}

/**
 * Follows a builder by profile slug, any casing. Following twice is not a
 * failure.
 *
 * @returns the follow state and the profile's follower count after the write
 * @throws CommunityApiError 400 for a malformed slug or the viewer's own
 *   profile, 401 signed out, 404 for an unknown profile
 */
export function followUser(username: string): Promise<FollowResponse> {
  return send({
    operation: "followUser",
    url: followRoute(username),
    init: { method: "POST" },
    guard: isFollowResponse,
  });
}

/**
 * Unfollows a builder by profile slug. Unfollowing someone the viewer does not
 * follow is not a failure.
 *
 * @returns the follow state and the profile's follower count after the write
 * @throws CommunityApiError 400 for a malformed slug or the viewer's own
 *   profile, 401 signed out, 404 for an unknown profile
 */
export function unfollowUser(username: string): Promise<FollowResponse> {
  return send({
    operation: "unfollowUser",
    url: followRoute(username),
    init: { method: "DELETE" },
    guard: isFollowResponse,
  });
}

// ─── Ratings and reviews ──────────────────────────────────────────────────────

/**
 * Reads a deck's ratings aggregate and reviews; a visitor may read it.
 * Gives up after {@link COMMUNITY_READ_TIMEOUT_MS}.
 *
 * @throws CommunityApiError 404 for a deck the viewer cannot see
 */
export function fetchDeckRatings(deckId: string): Promise<DeckRatingsResponse> {
  return send({
    operation: "fetchDeckRatings",
    url: deckRoute(deckId, "ratings"),
    init: { signal: AbortSignal.timeout(COMMUNITY_READ_TIMEOUT_MS) },
    guard: isDeckRatingsResponse,
  });
}

/**
 * Writes the viewer's rating of a deck, replacing an earlier one; with a
 * title and a body it is a written review.
 *
 * @returns the rating as saved
 * @throws CommunityApiError 400 for stars outside 1 to 5 or a review that
 *   breaks the review rules, 401 signed out, 403 on the viewer's own deck,
 *   404 for a deck they cannot see
 */
export function rateDeck(
  deckId: string,
  rating: RatingRequest
): Promise<SavedRatingResponse> {
  return send({
    operation: "rateDeck",
    url: deckRoute(deckId, "ratings"),
    init: jsonInit("POST", rating),
    guard: isSavedRatingResponse,
  });
}

/**
 * Removes the viewer's rating of a deck, review included. Removing a rating
 * that does not exist is not a failure.
 *
 * @throws CommunityApiError 401 signed out
 */
export function removeRating(deckId: string): Promise<void> {
  return sendForStatus("removeRating", deckRoute(deckId, "ratings"), {
    method: "DELETE",
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * Reads a deck's comment stream as threads, newest first; a visitor may read
 * it. Gives up after {@link COMMUNITY_READ_TIMEOUT_MS}.
 *
 * @throws CommunityApiError 404 for a deck the viewer cannot see
 */
export function fetchDeckComments(
  deckId: string
): Promise<DeckCommentsResponse> {
  return send({
    operation: "fetchDeckComments",
    url: deckRoute(deckId, "comments"),
    init: { signal: AbortSignal.timeout(COMMUNITY_READ_TIMEOUT_MS) },
    guard: isDeckCommentsResponse,
  });
}

/**
 * Posts a comment, or a reply when `parentId` names the comment it answers.
 * The body is sent without `parentId` for a top-level comment, as the panel
 * always sent it.
 *
 * @returns the comment as saved
 * @throws CommunityApiError 400 for an empty or too long body or a parent on
 *   another deck, 401 signed out, 404 for a deck the viewer cannot see
 */
export function postComment(
  deckId: string,
  body: string,
  parentId?: string
): Promise<DeckComment> {
  const request: CommentRequest =
    parentId === undefined ? { body } : { body, parentId };
  return send({
    operation: "postComment",
    url: deckRoute(deckId, "comments"),
    init: jsonInit("POST", request),
    guard: isDeckComment,
  });
}

function commentRoute(deckId: string, commentId: string): string {
  return deckRoute(deckId, `comments/${encodeURIComponent(commentId)}`);
}

/**
 * Rewrites the body of the viewer's own comment.
 *
 * @returns the comment as saved
 * @throws CommunityApiError 400 for an empty or too long body, 401 signed
 *   out, 404 for a comment that is not theirs or a deck they cannot see
 */
export function editComment(
  deckId: string,
  commentId: string,
  body: string
): Promise<DeckComment> {
  const request: CommentEditRequest = { body };
  return send({
    operation: "editComment",
    url: commentRoute(deckId, commentId),
    init: jsonInit("PATCH", request),
    guard: isDeckComment,
  });
}

/**
 * Deletes a comment and its replies. Its author may, and so may the deck's
 * owner, as the stream's one moderation tool.
 *
 * @throws CommunityApiError 401 signed out, 403 for someone else's comment on
 *   someone else's deck, 404 for an unknown comment or a deck the viewer cannot see
 */
export function deleteComment(
  deckId: string,
  commentId: string
): Promise<void> {
  return sendForStatus("deleteComment", commentRoute(deckId, commentId), {
    method: "DELETE",
  });
}

// ─── Saved decks and folders ──────────────────────────────────────────────────

/**
 * Bookmarks a public deck for the viewer, in one of their folders or unfiled
 * (`null`). Saving again moves the bookmark to that folder.
 *
 * @throws CommunityApiError 400 for a malformed folder id, 401 signed out,
 *   404 for a deck that is not public or a folder that is not theirs
 */
export function savePublicDeck(
  deckId: string,
  folderId: string | null
): Promise<SaveDeckResponse> {
  const body: SaveDeckRequest = { folderId };
  return send({
    operation: "savePublicDeck",
    url: deckRoute(deckId, "save"),
    init: jsonInit("POST", body),
    guard: isSaveDeckResponse,
  });
}

/**
 * Reads the viewer's saved-deck library: their folders, each with its saved
 * decks, and the unfiled saved decks. An entry the library cannot read is
 * dropped, not refused (`readSavedDeckFolders`).
 *
 * @throws CommunityApiError 401 signed out
 */
export async function fetchSavedDeckLibrary(): Promise<SavedDeckFoldersResponse> {
  const body = await send({
    operation: "fetchSavedDeckLibrary",
    url: `${COMMUNITY_API}/deck-folders`,
    guard: isSavedDeckLibraryBody,
  });
  return readSavedDeckFolders(body);
}

/**
 * Creates a folder in the viewer's library.
 *
 * @param name - trimmed by the route; 1 to 80 characters
 * @throws CommunityApiError 400 for an empty or too long name, 401 signed out
 */
export function createSavedDeckFolder(name: string): Promise<FolderResponse> {
  const body: FolderRequest = { name };
  return send({
    operation: "createSavedDeckFolder",
    url: `${COMMUNITY_API}/deck-folders`,
    init: jsonInit("POST", body),
    guard: isFolderResponse,
  });
}

/**
 * Renames one of the viewer's folders.
 *
 * @param name - trimmed by the route; 1 to 80 characters
 * @throws CommunityApiError 400 for a malformed id or name, 401 signed out,
 *   404 for a folder that is not theirs
 */
export function renameSavedDeckFolder(
  folderId: string,
  name: string
): Promise<FolderResponse> {
  const body: FolderRequest = { name };
  return send({
    operation: "renameSavedDeckFolder",
    url: folderRoute(folderId),
    init: jsonInit("PATCH", body),
    guard: isFolderResponse,
  });
}

/**
 * Deletes one of the viewer's folders; its saved decks become unfiled.
 *
 * @throws CommunityApiError 400 for a malformed id, 401 signed out, 404 for
 *   a folder that is not theirs
 */
export function deleteSavedDeckFolder(folderId: string): Promise<void> {
  return sendForStatus("deleteSavedDeckFolder", folderRoute(folderId), {
    method: "DELETE",
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

/**
 * Reports a public deck to the moderators, or changes the reason of the
 * viewer's pending report. A report a moderator already closed stays closed.
 *
 * @returns where the viewer's report stands
 * @throws CommunityApiError 400 for an unknown reason, 401 signed out, 403 on
 *   the viewer's own deck, 404 for a deck that is not public
 */
export function reportDeck(
  deckId: string,
  reason: ReportReason
): Promise<ReportResponse> {
  const body: ReportRequest = { reason };
  return send({
    operation: "reportDeck",
    url: deckRoute(deckId, "reports"),
    init: jsonInit("POST", body),
    guard: isReportResponse,
  });
}
