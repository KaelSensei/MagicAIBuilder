/**
 * The four things a viewer does with a deck's comment stream: list it, post
 * a comment or a reply, edit their own comment, delete a comment.
 *
 * Community context, application layer (master plan COM-13). Each use case
 * reads the deck through `VisibleDeckReader`, so a deck the viewer may not
 * see and a missing deck answer alike (COM-11), applies the rules of
 * `comment-policy.ts` and the body check of `comments.ts`, and answers a
 * discriminated result the routes under
 * `src/app/api/community/decks/[id]/comments` map to status codes. The
 * checks run in the order the routes ran them before this module existed;
 * the HTTP concerns (session, JSON parsing, the schema, logging, the 500)
 * stay in the routes. `comment-use-cases.server.ts` wires the real ports.
 *
 * @module community/comment-use-cases
 */
import {
  toDeckComment,
  type DeckCommentRow,
} from "@/lib/community/comment-mappers";
import {
  canDeleteComment,
  canEditComment,
  canPostOn,
  isReplyToSameDeck,
} from "@/lib/community/comment-policy";
import type {
  CommentDeck,
  CommentOwnership,
  CommentStore,
  VisibleDeckReader,
} from "@/lib/community/comment-store-port";
import {
  buildCommentTree,
  validateCommentBody,
  type DeckComment,
  type DeckCommentThread,
} from "@/lib/community/comments";
import type { DeckVisibilityFacts } from "@/lib/community/deck-visibility-policy";

/** The adapters the use cases run on; the server entry passes the real ones. */
export interface CommentUseCasePorts {
  readonly decks: VisibleDeckReader;
  readonly comments: CommentStore;
}

/** A deck's stream, asked for by anyone. */
export interface ListCommentsQuery {
  readonly deckId: string;
  /** The signed-in viewer, or null when anonymous. */
  readonly viewerId: string | null;
}

/** A comment or a reply, posted by a signed-in viewer. */
export interface PostCommentCommand {
  readonly deckId: string;
  readonly viewerId: string;
  /** The body as submitted; the use case trims it. */
  readonly body: string;
  /** The comment to reply to; absent for a top-level comment. */
  readonly parentId?: string;
}

/** A new body for one comment, from a signed-in viewer. */
export interface EditCommentCommand {
  readonly deckId: string;
  readonly commentId: string;
  readonly viewerId: string;
  /** The body as submitted; the use case trims it. */
  readonly body: string;
}

/** One comment to remove, asked by a signed-in viewer. */
export interface DeleteCommentCommand {
  readonly deckId: string;
  readonly commentId: string;
  readonly viewerId: string;
}

/** The deck is missing, or the viewer may not see it; the route answers 404. */
export interface DeckNotFound {
  readonly status: "deck-not-found";
}

/** The body is empty or too long; `errors` are `validateCommentBody`'s. */
export interface InvalidBody {
  readonly status: "invalid-body";
  readonly errors: readonly string[];
}

/** The stream, threaded, with the flat count the client shows. */
export type ListCommentsResult =
  | {
      readonly status: "ok";
      readonly comments: readonly DeckCommentThread[];
      readonly count: number;
    }
  | DeckNotFound;

/**
 * - `created`: the stored comment, badged for its author;
 * - `parent-not-found`: no comment has that `parentId` on this deck.
 */
export type PostCommentResult =
  | { readonly status: "created"; readonly comment: DeckComment }
  | DeckNotFound
  | InvalidBody
  | { readonly status: "parent-not-found" };

/**
 * - `edited`: the comment as stored after the write;
 * - `comment-not-found`: no such comment on this deck, or the viewer is not
 *   its author. Someone else's comment reads as not found, the same non-leak
 *   the deck visibility check uses.
 */
export type EditCommentResult =
  | { readonly status: "edited"; readonly comment: DeckComment }
  | DeckNotFound
  | InvalidBody
  | { readonly status: "comment-not-found" };

/**
 * - `deleted`: the comment and its replies are gone;
 * - `comment-not-found`: no such comment on this deck;
 * - `forbidden`: the viewer is neither the author nor the deck owner.
 */
export type DeleteCommentResult =
  | { readonly status: "deleted" }
  | DeckNotFound
  | { readonly status: "comment-not-found" }
  | { readonly status: "forbidden" };

/** The wired use cases. */
export interface CommentUseCases {
  listComments(query: ListCommentsQuery): Promise<ListCommentsResult>;
  postComment(command: PostCommentCommand): Promise<PostCommentResult>;
  editComment(command: EditCommentCommand): Promise<EditCommentResult>;
  deleteComment(command: DeleteCommentCommand): Promise<DeleteCommentResult>;
}

const DECK_NOT_FOUND: DeckNotFound = { status: "deck-not-found" };
const COMMENT_NOT_FOUND = { status: "comment-not-found" } as const;

/** The deck row as the visibility and owner rules read it. */
function visibilityFactsOf(deck: CommentDeck): DeckVisibilityFacts {
  return {
    ownerId: deck.userId,
    isPublic: deck.isPublic,
    shareEnabled: deck.shareEnabled,
  };
}

/** Whether this stored comment is one of the deck's; another deck's is not found. */
function isOnDeck(
  comment: CommentOwnership | null,
  deckId: string
): comment is CommentOwnership {
  return comment !== null && comment.deckId === deckId;
}

/**
 * Builds the comment use cases over the given ports.
 *
 * @param ports The deck reader and the comment store; fakes in tests.
 * @returns The four use cases, each resolving to its result union and
 *   rejecting only with what a port throws.
 */
export function makeCommentUseCases(
  ports: CommentUseCasePorts
): CommentUseCases {
  const { decks, comments } = ports;

  const present = (
    row: DeckCommentRow,
    deck: CommentDeck,
    viewerId: string | null
  ): DeckComment => toDeckComment(row, deck.userId, viewerId);

  return {
    async listComments({ deckId, viewerId }) {
      const deck = await decks.findVisibleDeck(deckId, viewerId);
      if (!deck) return DECK_NOT_FOUND;

      const rows = await comments.listByDeck(deckId);
      const stream = rows.map((row) => present(row, deck, viewerId));
      return {
        status: "ok",
        comments: buildCommentTree(stream),
        count: stream.length,
      };
    },

    async postComment({ deckId, viewerId, body, parentId }) {
      const deck = await decks.findVisibleDeck(deckId, viewerId);
      if (!deck || !canPostOn(visibilityFactsOf(deck), viewerId)) {
        return DECK_NOT_FOUND;
      }

      const validation = validateCommentBody(body);
      if (!validation.valid) {
        return { status: "invalid-body", errors: validation.errors };
      }

      if (parentId !== undefined) {
        const parent = await comments.findOwnership(parentId);
        if (!isReplyToSameDeck(parent, deckId)) {
          return { status: "parent-not-found" };
        }
      }

      const row = await comments.create({
        deckId,
        authorId: viewerId,
        parentId: parentId ?? null,
        body: body.trim(),
      });
      return { status: "created", comment: present(row, deck, viewerId) };
    },

    async editComment({ deckId, commentId, viewerId, body }) {
      const deck = await decks.findVisibleDeck(deckId, viewerId);
      if (!deck) return DECK_NOT_FOUND;

      const validation = validateCommentBody(body);
      if (!validation.valid) {
        return { status: "invalid-body", errors: validation.errors };
      }

      const comment = await comments.findOwnership(commentId);
      if (!isOnDeck(comment, deckId) || !canEditComment(comment, viewerId)) {
        return COMMENT_NOT_FOUND;
      }

      const written = await comments.updateBodyOfAuthored(
        { commentId, deckId, authorId: viewerId },
        body.trim()
      );
      if (!written) return COMMENT_NOT_FOUND;

      const row = await comments.findById(commentId);
      if (!row) return COMMENT_NOT_FOUND;
      return { status: "edited", comment: present(row, deck, viewerId) };
    },

    async deleteComment({ deckId, commentId, viewerId }) {
      const deck = await decks.findVisibleDeck(deckId, viewerId);
      if (!deck) return DECK_NOT_FOUND;

      const comment = await comments.findOwnership(commentId);
      if (!isOnDeck(comment, deckId)) return COMMENT_NOT_FOUND;

      if (!canDeleteComment(comment, { ownerId: deck.userId }, viewerId)) {
        return { status: "forbidden" };
      }

      await comments.deleteWithReplies(commentId);
      return { status: "deleted" };
    },
  };
}
