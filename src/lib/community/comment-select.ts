/**
 * Fields a comment exposes to the client.
 *
 * Read by `prismaCommentStore` (`comment-store.ts`) for every row it answers;
 * the two comment routes used to carry byte-identical copies. `userId` is
 * selected because `toDeckComment` resolves `isAuthor` and `isDeckOwner`
 * from it and strips it before the API answers, and a second copy of this
 * list is a second chance to forget that.
 */
export const COMMENT_SELECT = {
  id: true,
  deckId: true,
  userId: true,
  parentId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { name: true, username: true, image: true } },
} as const;
