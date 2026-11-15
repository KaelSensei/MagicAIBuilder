/**
 * What the comment use cases need from the outside: the deck they act on, as
 * the viewer may see it, and the stored comments of that deck.
 *
 * Community context, types only: no framework or database import, so the
 * use cases in `comment-use-cases.ts` run in Vitest on the fakes in
 * `testing/in-memory-comment-ports.ts`. Implementations: `findVisibleDeck`
 * in `visible-deck.ts` and `prismaCommentStore` in `comment-store.ts`, wired
 * by `comment-use-cases.server.ts`.
 *
 * @module community/comment-store-port
 */
import type { DeckCommentRow } from "@/lib/community/comment-mappers";

/** A deck as the comment use cases read it: its id, owner and visibility. */
export interface CommentDeck {
  readonly id: string;
  /** The owner's user id, or null for an ownerless deck. */
  readonly userId: string | null;
  readonly isPublic: boolean;
  readonly shareEnabled: boolean;
}

/**
 * Reads a deck for a viewer, applying the deck visibility policy.
 *
 * `findVisibleDeck` answers null for a missing deck and for a deck the viewer
 * may not see alike, so a route answers both the same way (COM-11).
 */
export interface VisibleDeckReader {
  findVisibleDeck(
    deckId: string,
    viewerId: string | null
  ): Promise<CommentDeck | null>;
}

/** Where a stored comment sits: its deck and its author. */
export interface CommentOwnership {
  readonly deckId: string;
  readonly authorId: string;
}

/** A comment to store; the body is already trimmed and within length. */
export interface NewComment {
  readonly deckId: string;
  readonly authorId: string;
  /** The parent comment on the same deck, or null for a top-level comment. */
  readonly parentId: string | null;
  readonly body: string;
}

/** The comment an edit targets, with the deck and author the write re-checks. */
export interface AuthoredCommentRef {
  readonly commentId: string;
  readonly deckId: string;
  readonly authorId: string;
}

/**
 * The stored comments of the decks.
 *
 * An implementation guarantees:
 * - `listByDeck` answers every comment of the deck, oldest first, with its
 *   author joined;
 * - `findOwnership` and `findById` answer null when no comment has that id;
 * - `create` stores the comment and answers the stored row, author joined;
 * - `updateBodyOfAuthored` writes only when the row still belongs to that
 *   deck and that author, and answers whether it did. The use case decided
 *   the rule from a read a moment earlier; the scoped write closes the window
 *   between the two, and keeps someone else's comment reading as not found;
 * - `deleteWithReplies` removes the comment and every reply under it, all or
 *   nothing;
 * - each throws whatever the database throws when it is unavailable.
 */
export interface CommentStore {
  listByDeck(deckId: string): Promise<readonly DeckCommentRow[]>;
  findOwnership(commentId: string): Promise<CommentOwnership | null>;
  findById(commentId: string): Promise<DeckCommentRow | null>;
  create(comment: NewComment): Promise<DeckCommentRow>;
  updateBodyOfAuthored(ref: AuthoredCommentRef, body: string): Promise<boolean>;
  deleteWithReplies(commentId: string): Promise<void>;
}
