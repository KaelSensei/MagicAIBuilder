import { describe, it, expect } from "vitest";

import {
  buildCommentTree,
  validateCommentBody,
  MAX_COMMENT_LENGTH,
  type DeckComment,
} from "./comments";

function makeComment(overrides: Partial<DeckComment> = {}): DeckComment {
  return {
    id: "c1",
    deckId: "deck-1",
    parentId: null,
    body: "Nice list!",
    createdAt: "2026-08-19T10:00:00.000Z",
    updatedAt: "2026-08-19T10:00:00.000Z",
    author: { name: "Ana", username: "ana", image: null },
    isDeckOwner: false,
    ...overrides,
  };
}

describe("validateCommentBody", () => {
  it("accepts an ordinary comment", () => {
    expect(validateCommentBody("Nice list!")).toEqual({ valid: true, errors: [] });
  });

  it("rejects an empty or whitespace-only body", () => {
    expect(validateCommentBody("").valid).toBe(false);
    expect(validateCommentBody("   \n\t ").valid).toBe(false);
  });

  it("rejects a body over the length cap and names the cap", () => {
    const result = validateCommentBody("x".repeat(MAX_COMMENT_LENGTH + 1));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain(String(MAX_COMMENT_LENGTH));
  });

  it("accepts a body exactly at the cap", () => {
    expect(validateCommentBody("x".repeat(MAX_COMMENT_LENGTH)).valid).toBe(true);
  });

  it("measures length after trimming", () => {
    // Padding must not push an otherwise-legal body over the cap.
    const padded = `  ${"x".repeat(MAX_COMMENT_LENGTH)}  `;
    expect(validateCommentBody(padded).valid).toBe(true);
  });
});

describe("buildCommentTree", () => {
  it("returns top-level comments newest first", () => {
    const tree = buildCommentTree([
      makeComment({ id: "old", createdAt: "2026-08-18T10:00:00.000Z" }),
      makeComment({ id: "new", createdAt: "2026-08-19T10:00:00.000Z" }),
    ]);
    expect(tree.map((t) => t.id)).toEqual(["new", "old"]);
  });

  it("nests replies under their parent, oldest first", () => {
    const tree = buildCommentTree([
      makeComment({ id: "top" }),
      makeComment({ id: "r2", parentId: "top", createdAt: "2026-08-19T12:00:00.000Z" }),
      makeComment({ id: "r1", parentId: "top", createdAt: "2026-08-19T11:00:00.000Z" }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("nests replies to replies", () => {
    const tree = buildCommentTree([
      makeComment({ id: "top" }),
      makeComment({ id: "child", parentId: "top" }),
      makeComment({ id: "grandchild", parentId: "child" }),
    ]);
    expect(tree[0].replies[0].replies[0].id).toBe("grandchild");
  });

  it("promotes an orphaned reply to top level rather than dropping it", () => {
    // The parent may have been deleted between the query and the build; a
    // comment someone wrote must never silently vanish from the stream.
    const tree = buildCommentTree([makeComment({ id: "orphan", parentId: "gone" })]);
    expect(tree.map((t) => t.id)).toEqual(["orphan"]);
  });

  it("returns an empty list for no comments", () => {
    expect(buildCommentTree([])).toEqual([]);
  });
});
