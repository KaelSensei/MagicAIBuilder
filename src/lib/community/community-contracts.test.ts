/**
 * The guards of the community contracts, on plain values: what each accepts
 * from a route's answer and what it refuses. The client's suite covers the
 * guards at the HTTP boundary; this one pins the edges of the shapes.
 */
import { describe, expect, it } from "vitest";
import {
  isDeckCommentThread,
  isDeckCommentsResponse,
  isDeckRatingsResponse,
  isFollowResponse,
  isSavedDeckLibraryBody,
  isVoteTallyResponse,
  REPORT_REASONS,
} from "@/lib/community/community-contracts";

const AUTHOR = { name: "Ana", username: "ana", image: null };

function comment(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    deckId: "deck-1",
    parentId: null,
    body: "Why no Cyclonic Rift?",
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-08-18T10:00:00.000Z",
    author: AUTHOR,
    isDeckOwner: false,
    isAuthor: false,
    replies: [],
    ...overrides,
  };
}

const RATINGS = {
  average: 0,
  count: 0,
  histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  badge: null,
  reviews: [],
  viewerRating: null,
};

describe("isVoteTallyResponse", () => {
  it("accepts a tally whose viewer vote is up, down or cleared", () => {
    expect(isVoteTallyResponse({ score: 1, viewerVote: 1 })).toBe(true);
    expect(isVoteTallyResponse({ score: -1, viewerVote: -1 })).toBe(true);
    expect(isVoteTallyResponse({ score: 0, viewerVote: null })).toBe(true);
  });

  it("refuses a viewer vote of zero: a cleared vote is null, never 0 (votes.ts)", () => {
    expect(isVoteTallyResponse({ score: 0, viewerVote: 0 })).toBe(false);
  });

  it("refuses a list, a string and a tally without a score", () => {
    expect(isVoteTallyResponse([])).toBe(false);
    expect(isVoteTallyResponse("4")).toBe(false);
    expect(isVoteTallyResponse({ viewerVote: null })).toBe(false);
  });
});

describe("isFollowResponse", () => {
  it("accepts the follow state with its count", () => {
    expect(isFollowResponse({ following: false, followerCount: 0 })).toBe(true);
  });

  it("refuses a count that is not a number", () => {
    expect(isFollowResponse({ following: true, followerCount: "5" })).toBe(
      false
    );
  });
});

describe("isDeckRatingsResponse", () => {
  it("accepts an aggregate with no ratings yet", () => {
    expect(isDeckRatingsResponse(RATINGS)).toBe(true);
  });

  it("accepts a review carrying fields the page does not render, whatever their type", () => {
    const review = {
      id: "r1",
      rating: 5,
      title: "Tight",
      body: "Fast.",
      author: AUTHOR,
      createdAt: new Date("2026-08-01"),
      helpfulCount: 3,
    };
    expect(isDeckRatingsResponse({ ...RATINGS, reviews: [review] })).toBe(true);
  });

  it("refuses a review without its author or a histogram missing a star", () => {
    const review = { id: "r1", rating: 5, title: "Tight", body: "Fast." };
    expect(isDeckRatingsResponse({ ...RATINGS, reviews: [review] })).toBe(
      false
    );
    expect(
      isDeckRatingsResponse({
        ...RATINGS,
        histogram: { 1: 0, 2: 0, 3: 0, 4: 0 },
      })
    ).toBe(false);
  });

  it("refuses a badge the pages have no style for", () => {
    expect(isDeckRatingsResponse({ ...RATINGS, badge: "staff_pick" })).toBe(
      false
    );
    expect(isDeckRatingsResponse({ ...RATINGS, badge: "highly_rated" })).toBe(
      true
    );
    expect(isDeckRatingsResponse({ ...RATINGS, badge: "low_rated" })).toBe(
      true
    );
  });
});

describe("isDeckCommentThread", () => {
  it("accepts a thread and checks every reply down the tree", () => {
    const deep = comment({
      replies: [comment({ id: "c2", replies: [comment({ id: "c3" })] })],
    });
    expect(isDeckCommentThread(deep)).toBe(true);
  });

  it("refuses a thread whose deepest reply lacks its replies list", () => {
    const { replies: _dropped, ...leaf } = comment({ id: "c3" });
    const deep = comment({ replies: [comment({ id: "c2", replies: [leaf] })] });
    expect(isDeckCommentThread(deep)).toBe(false);
  });

  it("refuses a comment whose author is missing or whose badges are not booleans", () => {
    expect(isDeckCommentThread(comment({ author: undefined }))).toBe(false);
    expect(isDeckCommentThread(comment({ isDeckOwner: "owner" }))).toBe(false);
  });

  it("refuses a date that is not an ISO string: the page builds a Date from it", () => {
    expect(isDeckCommentThread(comment({ createdAt: 1_755_511_200_000 }))).toBe(
      false
    );
  });
});

describe("isDeckCommentsResponse", () => {
  it("accepts an empty stream", () => {
    expect(isDeckCommentsResponse({ comments: [], count: 0 })).toBe(true);
  });

  it("refuses a stream without its count", () => {
    expect(isDeckCommentsResponse({ comments: [] })).toBe(false);
  });
});

describe("isSavedDeckLibraryBody", () => {
  it("accepts a library with its two lists, whatever the entries hold", () => {
    expect(isSavedDeckLibraryBody({ folders: [], unfiled: [{}] })).toBe(true);
  });

  it("refuses a library missing a list", () => {
    expect(isSavedDeckLibraryBody({ folders: [] })).toBe(false);
    expect(isSavedDeckLibraryBody(null)).toBe(false);
  });
});

describe("REPORT_REASONS", () => {
  it("lists the route's four reasons, in the order the report dialog shows them", () => {
    expect(REPORT_REASONS).toEqual([
      "spam",
      "harassment",
      "illegal_content",
      "other",
    ]);
  });
});
