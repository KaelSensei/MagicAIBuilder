/**
 * The comment store on PostgreSQL: the `DeckComment` rows behind the
 * `CommentStore` port of `comment-store-port.ts`.
 *
 * Each method is the one Prisma call the comment routes made before COM-13,
 * with the same `select` (`COMMENT_SELECT`) and the same `where`, so the
 * route tests' Prisma stubs answer it unchanged. A delete is one statement:
 * the replies go with it through the self-relation's `ON DELETE CASCADE`
 * (`prisma/schema.prisma`, `DeckComment.parent`), so the comment and its
 * replies are removed together or not at all without an explicit
 * transaction.
 *
 * @module community/comment-store
 */
import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { DeckCommentRow } from "@/lib/community/comment-mappers";
import { COMMENT_SELECT } from "@/lib/community/comment-select";
import type {
  AuthoredCommentRef,
  CommentOwnership,
  CommentStore,
  NewComment,
} from "@/lib/community/comment-store-port";

/** The two columns the ownership rules read. */
const OWNERSHIP_SELECT = { userId: true, deckId: true } as const;

/** The stored comments, read and written through the shared Prisma client. */
export const prismaCommentStore: CommentStore = {
  listByDeck(deckId: string): Promise<readonly DeckCommentRow[]> {
    return prisma.deckComment.findMany({
      where: { deckId },
      orderBy: { createdAt: "asc" },
      select: COMMENT_SELECT,
    });
  },

  async findOwnership(commentId: string): Promise<CommentOwnership | null> {
    const row = await prisma.deckComment.findUnique({
      where: { id: commentId },
      select: OWNERSHIP_SELECT,
    });
    return row ? { deckId: row.deckId, authorId: row.userId } : null;
  },

  findById(commentId: string): Promise<DeckCommentRow | null> {
    return prisma.deckComment.findUnique({
      where: { id: commentId },
      select: COMMENT_SELECT,
    });
  },

  create(comment: NewComment): Promise<DeckCommentRow> {
    return prisma.deckComment.create({
      data: {
        deckId: comment.deckId,
        userId: comment.authorId,
        parentId: comment.parentId,
        body: comment.body,
      },
      select: COMMENT_SELECT,
    });
  },

  async updateBodyOfAuthored(
    ref: AuthoredCommentRef,
    body: string
  ): Promise<boolean> {
    const updated = await prisma.deckComment.updateMany({
      where: { id: ref.commentId, deckId: ref.deckId, userId: ref.authorId },
      data: { body },
    });
    return updated.count > 0;
  },

  async deleteWithReplies(commentId: string): Promise<void> {
    await prisma.deckComment.delete({ where: { id: commentId } });
  },
};
