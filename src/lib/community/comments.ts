/**
 * Deck comments — pure domain logic.
 *
 * A comment stream is deliberately separate from ratings: `DeckRating` holds
 * one written review per user per deck, while comments are conversational —
 * many per user, and threaded via `parentId`.
 *
 * Zero framework dependencies.
 *
 * @module community/comments
 */

/** Longest body accepted, measured after trimming. */
export const MAX_COMMENT_LENGTH = 2000;

/** The comment author, as shown beside the comment. */
export interface CommentAuthor {
  readonly name: string | null;
  readonly username: string | null;
  readonly image: string | null;
}

/** One comment as the API serves it — dates as ISO strings. */
export interface DeckComment {
  readonly id: string;
  readonly deckId: string;
  readonly parentId: string | null;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: CommentAuthor;
  /** True when the author owns the deck — lets the UI badge their replies */
  readonly isDeckOwner: boolean;
}

/** A comment with its replies resolved into a tree. */
export interface DeckCommentThread extends DeckComment {
  readonly replies: readonly DeckCommentThread[];
}

/** Either a clean bill or the reasons the body was refused. */
export interface CommentValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates a comment body.
 *
 * @param body - the raw body as submitted
 * @returns whether it may be stored, and why not if not
 */
export function validateCommentBody(body: string): CommentValidation {
  const trimmed = body.trim();
  const errors: string[] = [];

  if (trimmed.length === 0) {
    errors.push("Comment cannot be empty");
  } else if (trimmed.length > MAX_COMMENT_LENGTH) {
    errors.push(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`);
  }

  return { valid: errors.length === 0, errors };
}

interface MutableThread extends DeckComment {
  replies: MutableThread[];
}

/**
 * Assembles a flat comment list into threads.
 *
 * Top-level comments come newest first (the stream reads like a feed);
 * replies come oldest first (a conversation reads downward). A reply whose
 * parent is missing from the list — deleted between query and build — is
 * promoted to top level rather than dropped: a comment someone wrote must
 * never silently vanish.
 *
 * @param comments - every comment of one deck, any order
 * @returns top-level threads with nested replies
 */
export function buildCommentTree(
  comments: readonly DeckComment[]
): readonly DeckCommentThread[] {
  const byId = new Map<string, MutableThread>(
    comments.map((comment) => [comment.id, { ...comment, replies: [] }])
  );

  const topLevel: MutableThread[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId === null ? undefined : byId.get(node.parentId);
    if (parent) {
      parent.replies.push(node);
    } else {
      topLevel.push(node);
    }
  }

  const byCreatedAt = (a: MutableThread, b: MutableThread): number =>
    a.createdAt.localeCompare(b.createdAt);

  const sortReplies = (nodes: MutableThread[]): void => {
    nodes.sort(byCreatedAt);
    for (const node of nodes) sortReplies(node.replies);
  };
  for (const node of topLevel) sortReplies(node.replies);
  topLevel.sort((a, b) => byCreatedAt(b, a));

  return topLevel;
}
