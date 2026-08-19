/**
 * Prisma-row → domain mappers for deck comments.
 *
 * The row type is declared structurally rather than imported from
 * `@prisma/client`, so the domain layer never depends on generated types.
 *
 * @module community/comment-mappers
 */

import type { CommentAuthor, DeckComment } from "./comments";

/** The comment row as the route selects it, author joined. */
export interface DeckCommentRow {
  readonly id: string;
  readonly deckId: string;
  readonly userId: string;
  readonly parentId: string | null;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user: CommentAuthor;
}

/**
 * Maps one database row to the shape the API serves.
 *
 * @param row - the selected row, author included
 * @param deckOwnerId - the deck owner's user id, or null for ownerless decks
 * @returns the comment with dates as ISO strings and the owner badge resolved
 */
export function toDeckComment(
  row: DeckCommentRow,
  deckOwnerId: string | null
): DeckComment {
  return {
    id: row.id,
    deckId: row.deckId,
    parentId: row.parentId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: row.user,
    isDeckOwner: deckOwnerId !== null && row.userId === deckOwnerId,
  };
}
