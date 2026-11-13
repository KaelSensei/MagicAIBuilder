/**
 * In-memory fakes of the comment ports for tests (ADR 0005: owned ports get
 * a hand-written fake).
 *
 * `inMemoryVisibleDecks` applies the same `canViewDeck` policy as
 * `findVisibleDeck`, so a use-case test sees a private deck vanish for a
 * stranger exactly as the route does. `inMemoryCommentStore` keeps rows in a
 * Map, stamps each new comment one second after the previous one so order is
 * deterministic, and cascades a delete to the replies in one synchronous
 * step, as the database's `ON DELETE CASCADE` does.
 *
 * @module community/testing/in-memory-comment-ports
 */
import type { DeckCommentRow } from "@/lib/community/comment-mappers";
import type { CommentAuthor } from "@/lib/community/comments";
import type {
  AuthoredCommentRef,
  CommentDeck,
  CommentOwnership,
  CommentStore,
  NewComment,
  VisibleDeckReader,
} from "@/lib/community/comment-store-port";
import {
  canViewDeck,
  DECK_ACCESS_BY_ID,
} from "@/lib/community/deck-visibility-policy";

/** When the first seeded or created comment is stamped. */
export const FIRST_COMMENT_AT = new Date("2026-08-19T10:00:00Z");

const ONE_SECOND_MS = 1000;

/** The author every fake row carries when the test names none. */
const DEFAULT_AUTHOR: CommentAuthor = {
  name: "Ana",
  username: "ana",
  image: null,
};

/** A deck reader over the given decks, visibility decided by `canViewDeck`. */
export function inMemoryVisibleDecks(
  decks: readonly CommentDeck[]
): VisibleDeckReader {
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  return {
    async findVisibleDeck(deckId, viewerId) {
      const deck = byId.get(deckId);
      if (!deck) return null;
      const decision = canViewDeck(
        {
          ownerId: deck.userId,
          isPublic: deck.isPublic,
          shareEnabled: deck.shareEnabled,
        },
        viewerId,
        DECK_ACCESS_BY_ID
      );
      return decision.allowed ? deck : null;
    },
  };
}

/** The fake store, plus the seeding and inspection its tests use. */
export interface InMemoryCommentStore extends CommentStore {
  /** The stored rows by id; exposed for assertions. */
  readonly rows: ReadonlyMap<string, DeckCommentRow>;
  /** Stores a comment as if it had been posted, and answers its row. */
  seed(comment: NewComment): DeckCommentRow;
}

/** A comment store over a Map; see the module header for its guarantees. */
export function inMemoryCommentStore(): InMemoryCommentStore {
  const rows = new Map<string, DeckCommentRow>();
  let sequence = 0;

  /** One second after the previous stamp: every write has its own instant. */
  const nextStamp = (): Date => {
    const stampedAt = new Date(
      FIRST_COMMENT_AT.getTime() + sequence * ONE_SECOND_MS
    );
    sequence += 1;
    return stampedAt;
  };

  const store = (comment: NewComment): DeckCommentRow => {
    const stampedAt = nextStamp();
    const row: DeckCommentRow = {
      id: `c${sequence}`,
      deckId: comment.deckId,
      userId: comment.authorId,
      parentId: comment.parentId,
      body: comment.body,
      createdAt: stampedAt,
      updatedAt: stampedAt,
      user: DEFAULT_AUTHOR,
    };
    rows.set(row.id, row);
    return row;
  };

  const ownershipOf = (row: DeckCommentRow): CommentOwnership => ({
    deckId: row.deckId,
    authorId: row.userId,
  });

  const removeWithReplies = (commentId: string): void => {
    rows.delete(commentId);
    for (const row of rows.values()) {
      if (row.parentId === commentId) removeWithReplies(row.id);
    }
  };

  return {
    rows,
    seed: store,
    async listByDeck(deckId) {
      return [...rows.values()]
        .filter((row) => row.deckId === deckId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    async findOwnership(commentId) {
      const row = rows.get(commentId);
      return row ? ownershipOf(row) : null;
    },
    async findById(commentId) {
      return rows.get(commentId) ?? null;
    },
    async create(comment) {
      return store(comment);
    },
    async updateBodyOfAuthored(ref: AuthoredCommentRef, body: string) {
      const row = rows.get(ref.commentId);
      if (!row || row.deckId !== ref.deckId || row.userId !== ref.authorId) {
        return false;
      }
      rows.set(ref.commentId, { ...row, body, updatedAt: nextStamp() });
      return true;
    },
    async deleteWithReplies(commentId) {
      removeWithReplies(commentId);
    },
  };
}
