/**
 * Pins the exact log line of each community client error. The deck client's
 * `DeckApiError` reads the same way, so one log search finds both; a change
 * of a single byte here is a change to what operators grep for.
 */
import { describe, expect, it } from "vitest";

import {
  CommunityApiError,
  MalformedCommunityAnswerError,
} from "@/lib/community/community-client-errors";

describe("CommunityApiError", () => {
  it("reads `[operation] HTTP <status>: <detail>` when the route sent its own error text", () => {
    const error = new CommunityApiError(
      "castVote",
      400,
      "Vote must be 1 or -1"
    );

    expect(error.message).toBe("[castVote] HTTP 400: Vote must be 1 or -1");
  });

  it("reads `[operation] HTTP <status>` with no trailing colon when the route sent no error text", () => {
    expect(new CommunityApiError("castVote", 500).message).toBe(
      "[castVote] HTTP 500"
    );
    expect(new CommunityApiError("castVote", 502, "").message).toBe(
      "[castVote] HTTP 502"
    );
  });
});

describe("MalformedCommunityAnswerError", () => {
  it("names the operation and the 2xx status, and keeps the parse error as its cause", () => {
    const cause = new SyntaxError("Unexpected token");
    const error = new MalformedCommunityAnswerError(
      "fetchComments",
      200,
      cause
    );

    expect(error.message).toBe(
      "[fetchComments] HTTP 200: the answer is not the expected shape"
    );
    expect(error.cause).toBe(cause);
  });
});
