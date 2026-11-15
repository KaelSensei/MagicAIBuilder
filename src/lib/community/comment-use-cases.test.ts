/**
 * The four comment use cases on in-memory ports: each outcome the routes map
 * to a status code, and the order the checks run in, as the routes ran them
 * before COM-13.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { MAX_COMMENT_LENGTH } from "./comments";
import type { CommentDeck } from "./comment-store-port";
import { makeCommentUseCases, type CommentUseCases } from "./comment-use-cases";
import {
  inMemoryCommentStore,
  inMemoryVisibleDecks,
  type InMemoryCommentStore,
} from "./testing/in-memory-comment-ports";

const OWNER = "owner-1";
const AUTHOR = "author-1";
const STRANGER = "stranger-1";

const PUBLIC_DECK: CommentDeck = {
  id: "public-deck",
  userId: OWNER,
  isPublic: true,
  shareEnabled: false,
};
const PRIVATE_DECK: CommentDeck = {
  id: "private-deck",
  userId: OWNER,
  isPublic: false,
  shareEnabled: false,
};

let store: InMemoryCommentStore;
let useCases: CommentUseCases;

beforeEach(() => {
  store = inMemoryCommentStore();
  useCases = makeCommentUseCases({
    decks: inMemoryVisibleDecks([PUBLIC_DECK, PRIVATE_DECK]),
    comments: store,
  });
});

function seedComment(
  overrides: Partial<{
    deckId: string;
    authorId: string;
    parentId: string;
  }> = {}
) {
  return store.seed({
    deckId: PUBLIC_DECK.id,
    authorId: AUTHOR,
    parentId: null,
    body: "Nice list!",
    ...overrides,
  });
}

describe("listComments", () => {
  it("threads the deck's comments for an anonymous viewer", async () => {
    const top = seedComment();
    seedComment({ parentId: top.id });

    const result = await useCases.listComments({
      deckId: PUBLIC_DECK.id,
      viewerId: null,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.count).toBe(2);
    expect(result.comments).toHaveLength(1);
    expect(result.comments[0]?.replies).toHaveLength(1);
    expect(result.comments[0]?.isAuthor).toBe(false);
  });

  it("marks the viewer's own comments and badges the deck owner's", async () => {
    const mine = seedComment({ authorId: AUTHOR });
    const owners = seedComment({ authorId: OWNER });

    const result = await useCases.listComments({
      deckId: PUBLIC_DECK.id,
      viewerId: AUTHOR,
    });

    if (result.status !== "ok") throw new Error(result.status);
    const byId = new Map(result.comments.map((c) => [c.id, c]));
    expect(byId.get(mine.id)?.isAuthor).toBe(true);
    expect(byId.get(mine.id)?.isDeckOwner).toBe(false);
    expect(byId.get(owners.id)?.isAuthor).toBe(false);
    expect(byId.get(owners.id)?.isDeckOwner).toBe(true);
  });

  it.each([
    ["a stranger", STRANGER],
    ["an anonymous viewer", null],
  ])(
    "hides a private deck's stream from %s as not found",
    async (_who, viewerId) => {
      const result = await useCases.listComments({
        deckId: PRIVATE_DECK.id,
        viewerId,
      });

      expect(result).toEqual({ status: "deck-not-found" });
    }
  );

  it("lets the owner read their private deck's stream", async () => {
    const result = await useCases.listComments({
      deckId: PRIVATE_DECK.id,
      viewerId: OWNER,
    });

    expect(result).toEqual({ status: "ok", comments: [], count: 0 });
  });

  it("answers not found for a deck that does not exist", async () => {
    const result = await useCases.listComments({
      deckId: "no-such-deck",
      viewerId: OWNER,
    });

    expect(result).toEqual({ status: "deck-not-found" });
  });
});

describe("postComment", () => {
  it("stores a trimmed top-level comment and answers it as the author's", async () => {
    const result = await useCases.postComment({
      deckId: PUBLIC_DECK.id,
      viewerId: AUTHOR,
      body: "  Nice list!  ",
    });

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.comment.body).toBe("Nice list!");
    expect(result.comment.parentId).toBeNull();
    expect(result.comment.isAuthor).toBe(true);
    expect(result.comment.isDeckOwner).toBe(false);
    expect(store.rows.get(result.comment.id)?.body).toBe("Nice list!");
  });

  it("lets the deck owner post on their own deck, badged as the owner", async () => {
    const result = await useCases.postComment({
      deckId: PUBLIC_DECK.id,
      viewerId: OWNER,
      body: "Thanks!",
    });

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.comment.isDeckOwner).toBe(true);
  });

  it.each([
    ["an empty body", "   ", "Comment cannot be empty"],
    [
      "an over-long body",
      "x".repeat(MAX_COMMENT_LENGTH + 1),
      `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`,
    ],
  ])(
    "refuses %s with the validation error and stores nothing",
    async (_case, body, error) => {
      const result = await useCases.postComment({
        deckId: PUBLIC_DECK.id,
        viewerId: AUTHOR,
        body,
      });

      expect(result).toEqual({ status: "invalid-body", errors: [error] });
      expect(store.rows.size).toBe(0);
    }
  );

  it("refuses a reply whose parent lives on another deck", async () => {
    const parent = seedComment({ deckId: PRIVATE_DECK.id, authorId: OWNER });

    const result = await useCases.postComment({
      deckId: PUBLIC_DECK.id,
      viewerId: AUTHOR,
      body: "reply",
      parentId: parent.id,
    });

    expect(result).toEqual({ status: "parent-not-found" });
    expect(store.rows.size).toBe(1);
  });

  it("refuses a reply to a parent that does not exist", async () => {
    const result = await useCases.postComment({
      deckId: PUBLIC_DECK.id,
      viewerId: AUTHOR,
      body: "reply",
      parentId: "gone",
    });

    expect(result).toEqual({ status: "parent-not-found" });
  });

  it("threads a reply under its parent", async () => {
    const parent = seedComment();

    const result = await useCases.postComment({
      deckId: PUBLIC_DECK.id,
      viewerId: STRANGER,
      body: "reply",
      parentId: parent.id,
    });

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.comment.parentId).toBe(parent.id);
  });

  it("hides a private deck from a stranger as not found and stores nothing", async () => {
    const result = await useCases.postComment({
      deckId: PRIVATE_DECK.id,
      viewerId: STRANGER,
      body: "hello",
    });

    expect(result).toEqual({ status: "deck-not-found" });
    expect(store.rows.size).toBe(0);
  });
});

describe("editComment", () => {
  it("lets the author rewrite their comment, trimmed, and answers the stored row", async () => {
    const comment = seedComment();

    const result = await useCases.editComment({
      deckId: PUBLIC_DECK.id,
      commentId: comment.id,
      viewerId: AUTHOR,
      body: "  Edited  ",
    });

    expect(result.status).toBe("edited");
    if (result.status !== "edited") return;
    expect(result.comment.body).toBe("Edited");
    expect(result.comment.isAuthor).toBe(true);
    expect(result.comment.updatedAt > result.comment.createdAt).toBe(true);
  });

  it.each([
    ["a stranger", STRANGER],
    ["the deck owner", OWNER],
  ])(
    "reads as not found to %s, who is not the author, and keeps the body",
    async (_who, viewerId) => {
      const comment = seedComment();

      const result = await useCases.editComment({
        deckId: PUBLIC_DECK.id,
        commentId: comment.id,
        viewerId,
        body: "Edited",
      });

      expect(result).toEqual({ status: "comment-not-found" });
      expect(store.rows.get(comment.id)?.body).toBe("Nice list!");
    }
  );

  it("reads a comment on another deck as not found", async () => {
    const comment = seedComment({ deckId: PRIVATE_DECK.id, authorId: OWNER });

    const result = await useCases.editComment({
      deckId: PUBLIC_DECK.id,
      commentId: comment.id,
      viewerId: OWNER,
      body: "Edited",
    });

    expect(result).toEqual({ status: "comment-not-found" });
  });

  it("refuses an empty body before looking the comment up", async () => {
    const result = await useCases.editComment({
      deckId: PUBLIC_DECK.id,
      commentId: "gone",
      viewerId: AUTHOR,
      body: " ",
    });

    expect(result).toEqual({
      status: "invalid-body",
      errors: ["Comment cannot be empty"],
    });
  });

  it("hides a private deck from a stranger as deck not found", async () => {
    const comment = seedComment({
      deckId: PRIVATE_DECK.id,
      authorId: STRANGER,
    });

    const result = await useCases.editComment({
      deckId: PRIVATE_DECK.id,
      commentId: comment.id,
      viewerId: STRANGER,
      body: "Edited",
    });

    expect(result).toEqual({ status: "deck-not-found" });
  });
});

describe("deleteComment", () => {
  it("lets the author delete their comment, replies included", async () => {
    const comment = seedComment();
    const reply = seedComment({ authorId: STRANGER, parentId: comment.id });

    const result = await useCases.deleteComment({
      deckId: PUBLIC_DECK.id,
      commentId: comment.id,
      viewerId: AUTHOR,
    });

    expect(result).toEqual({ status: "deleted" });
    expect(store.rows.has(comment.id)).toBe(false);
    expect(store.rows.has(reply.id)).toBe(false);
  });

  it("lets the deck owner delete anyone's comment", async () => {
    const comment = seedComment();

    const result = await useCases.deleteComment({
      deckId: PUBLIC_DECK.id,
      commentId: comment.id,
      viewerId: OWNER,
    });

    expect(result).toEqual({ status: "deleted" });
    expect(store.rows.size).toBe(0);
  });

  it("forbids a stranger and keeps the comment", async () => {
    const comment = seedComment();

    const result = await useCases.deleteComment({
      deckId: PUBLIC_DECK.id,
      commentId: comment.id,
      viewerId: STRANGER,
    });

    expect(result).toEqual({ status: "forbidden" });
    expect(store.rows.has(comment.id)).toBe(true);
  });

  it("reads a comment on another deck as not found", async () => {
    const comment = seedComment({ deckId: PRIVATE_DECK.id, authorId: OWNER });

    const result = await useCases.deleteComment({
      deckId: PUBLIC_DECK.id,
      commentId: comment.id,
      viewerId: OWNER,
    });

    expect(result).toEqual({ status: "comment-not-found" });
    expect(store.rows.has(comment.id)).toBe(true);
  });

  it("reads a comment that does not exist as not found", async () => {
    const result = await useCases.deleteComment({
      deckId: PUBLIC_DECK.id,
      commentId: "gone",
      viewerId: AUTHOR,
    });

    expect(result).toEqual({ status: "comment-not-found" });
  });

  it("hides a private deck from a stranger as deck not found", async () => {
    const comment = seedComment({
      deckId: PRIVATE_DECK.id,
      authorId: STRANGER,
    });

    const result = await useCases.deleteComment({
      deckId: PRIVATE_DECK.id,
      commentId: comment.id,
      viewerId: STRANGER,
    });

    expect(result).toEqual({ status: "deck-not-found" });
    expect(store.rows.has(comment.id)).toBe(true);
  });
});
