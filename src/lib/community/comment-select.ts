/**
 * Fields a comment exposes to the client.
 *
 * Shared by the comment list route and the edit/delete route, which carried
 * byte-identical copies. `userId` is selected because the routes resolve
 * `isAuthor` from it; they strip it before responding, and a second copy of
 * this list is a second chance to forget that.
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
