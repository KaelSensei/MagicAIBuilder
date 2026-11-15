/**
 * The comment use cases wired to the real adapters: `findVisibleDeck`
 * (COM-11's deck visibility repository) and `prismaCommentStore`.
 *
 * Community context, composition root for the server. The routes under
 * `src/app/api/community/decks/[id]/comments` import `deckComments` from here
 * and nothing from the adapters, so a test of a use case needs no Prisma.
 *
 * @module community/comment-use-cases.server
 */
import "server-only";
import { prismaCommentStore } from "@/lib/community/comment-store";
import {
  makeCommentUseCases,
  type CommentUseCases,
} from "@/lib/community/comment-use-cases";
import { findVisibleDeck } from "@/lib/community/visible-deck";

/** The comment use cases on PostgreSQL. */
export const deckComments: CommentUseCases = makeCommentUseCases({
  decks: { findVisibleDeck },
  comments: prismaCommentStore,
});
