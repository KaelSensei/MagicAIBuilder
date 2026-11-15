/**
 * Who may do what to a deck's comment stream: post, reply, edit, delete.
 *
 * Community context, pure rules. Each function states one rule the comment
 * routes used to apply inline, written as they applied it on 2026-11-13
 * (master plan COM-13); none was redesigned. The use cases in
 * `comment-use-cases.ts` call them; `comment-policy.test.ts` tables them.
 *
 * Visibility is not decided here: `canViewDeck` in `deck-visibility-policy.ts`
 * owns it, and `canPostOn` composes it.
 *
 * Not responsible for: the body's length (`validateCommentBody` in
 * `comments.ts`) and whether a comment belongs to the deck named in the URL
 * (the use case checks the stored `deckId` before asking any rule here).
 *
 * @module community/comment-policy
 */
import {
  canViewDeck,
  DECK_ACCESS_BY_ID,
  type DeckVisibilityFacts,
} from "@/lib/community/deck-visibility-policy";

/** The one fact the author rules read: who wrote the comment. */
export interface AuthoredComment {
  readonly authorId: string;
}

/** The one fact the owner rule reads: who owns the deck, if anyone. */
export interface OwnedDeck {
  readonly ownerId: string | null;
}

/** The one fact the reply rule reads: which deck the parent comment is on. */
export interface ParentComment {
  readonly deckId: string;
}

/**
 * Whether the viewer may post a comment or a reply on this deck.
 *
 * A signed-in viewer who may see the deck by id may post; the deck owner
 * included, unlike votes and ratings, because a stream the author cannot
 * answer in is half a conversation. Anonymous viewers may read but not post.
 *
 * @param deck The deck's visibility facts.
 * @param viewerId The signed-in user, or null when anonymous.
 */
export function canPostOn(
  deck: DeckVisibilityFacts,
  viewerId: string | null
): boolean {
  if (viewerId === null) return false;
  return canViewDeck(deck, viewerId, DECK_ACCESS_BY_ID).allowed;
}

/**
 * Whether a reply may thread under this parent.
 *
 * The parent must exist and sit on the same deck: a `parentId` pointing
 * anywhere else would thread two decks' streams together.
 *
 * @param parent The stored parent comment, or null when no comment has that id.
 * @param deckId The deck the reply is posted on.
 */
export function isReplyToSameDeck(
  parent: ParentComment | null,
  deckId: string
): boolean {
  return parent !== null && parent.deckId === deckId;
}

/**
 * Whether the viewer may edit this comment: its author only.
 *
 * The deck owner may delete but not rewrite someone else's words.
 *
 * @param comment The stored comment's author.
 * @param viewerId The signed-in user, or null when anonymous.
 */
export function canEditComment(
  comment: AuthoredComment,
  viewerId: string | null
): boolean {
  return viewerId !== null && comment.authorId === viewerId;
}

/**
 * Whether the viewer may delete this comment: its author, or the owner of
 * the deck it sits on, as the stream's minimal moderation surface.
 *
 * An ownerless deck has no moderator: only the author may delete there.
 *
 * @param comment The stored comment's author.
 * @param deck The deck's owner, or null for an ownerless deck.
 * @param viewerId The signed-in user, or null when anonymous.
 */
export function canDeleteComment(
  comment: AuthoredComment,
  deck: OwnedDeck,
  viewerId: string | null
): boolean {
  if (viewerId === null) return false;
  return comment.authorId === viewerId || deck.ownerId === viewerId;
}
