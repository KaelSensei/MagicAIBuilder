import { describe, expect, it } from "vitest";
import {
  DeckBuildRefusedError,
  DeckBuildServerError,
  DeckBuildUnreachableError,
  deckBuildFailureLogLevel,
  deckBuildFailureMessageKey,
  deckBuildFailureOf,
  type DeckBuildFailure,
} from "@/lib/ai/build-failure";

describe("deckBuildFailureOf", () => {
  it("reads a request that got no answer as unreachable", () => {
    const lost = new DeckBuildUnreachableError(
      new TypeError("Failed to fetch")
    );

    expect(deckBuildFailureOf(lost)).toBe("unreachable");
  });

  it("reads a 401 refusal as an ended session", () => {
    expect(deckBuildFailureOf(new DeckBuildRefusedError(401))).toBe(
      "signed-out"
    );
  });

  it("reads a 429 refusal as too many builds in a short time", () => {
    expect(deckBuildFailureOf(new DeckBuildRefusedError(429))).toBe(
      "rate-limited"
    );
  });

  it.each([400, 403, 500, 502, 503])(
    "reads a %i refusal as a failed build",
    (status) => {
      expect(deckBuildFailureOf(new DeckBuildRefusedError(status))).toBe(
        "failed"
      );
    }
  );

  it.each([
    [
      "the stream's error event",
      new DeckBuildServerError("AI deck build failed"),
    ],
    ["a stream cut short", new Error("The AI build ended early")],
    // A response arrived, so the network did answer: a stream dropped
    // mid-read, or a bug in the code that reads it.
    ["a TypeError thrown after the answer", new TypeError("network error")],
    ["a thrown value that is not an Error", "boom"],
  ])("reads %s as a failed build", (_case, thrown) => {
    expect(deckBuildFailureOf(thrown)).toBe("failed");
  });

  it("reads the type and the status, never the message", () => {
    expect(deckBuildFailureOf(new Error("Failed to fetch"))).toBe("failed");
    expect(deckBuildFailureOf(new Error("Build request failed (401)"))).toBe(
      "failed"
    );
  });
});

describe("deckBuildFailureLogLevel", () => {
  const RESET = new Date("2026-12-01T00:00:00.000Z");

  it.each([
    [
      "a request that got no answer",
      new DeckBuildUnreachableError(new TypeError("Failed to fetch")),
    ],
    ["an ended session (401)", new DeckBuildRefusedError(401)],
    ["the rate limit (429)", new DeckBuildRefusedError(429)],
    [
      "a spent monthly allowance",
      new DeckBuildRefusedError(429, {
        code: "allowance_exhausted",
        route: "build",
        limit: 5,
        resetsAt: RESET,
      }),
    ],
    [
      "the spend ceiling",
      new DeckBuildRefusedError(503, {
        code: "ai_spend_ceiling_reached",
        resetsAt: RESET,
      }),
    ],
    [
      "the stream's error event, which the route has already reported",
      new DeckBuildServerError("AI deck build failed"),
    ],
  ])("logs %s as a warning", (_case, error) => {
    expect(deckBuildFailureLogLevel(error)).toBe("warn");
  });

  it.each([
    ["a 500 refusal", new DeckBuildRefusedError(500)],
    ["a 400 refusal", new DeckBuildRefusedError(400)],
    ["a stream cut short", new Error("The AI build ended early")],
    ["a TypeError thrown after the answer", new TypeError("network error")],
    ["a thrown value that is not an Error", "boom"],
  ])("logs %s as an error", (_case, error) => {
    expect(deckBuildFailureLogLevel(error)).toBe("error");
  });
});

describe("deckBuildFailureMessageKey", () => {
  it.each<readonly [DeckBuildFailure, string]>([
    ["unreachable", "wizard.buildUnreachable"],
    ["rate-limited", "wizard.buildRateLimited"],
    ["signed-out", "wizard.buildSignedOut"],
    ["failed", "wizard.buildFailed"],
  ])("gives a %s build the deck catalog's %s", (failure, key) => {
    expect(deckBuildFailureMessageKey(failure)).toBe(key);
  });
});
