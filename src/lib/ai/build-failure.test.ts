import { describe, expect, it } from "vitest";
import {
  DeckBuildRefusedError,
  deckBuildFailureMessageKey,
  deckBuildFailureOf,
  type DeckBuildFailure,
} from "@/lib/ai/build-failure";

describe("deckBuildFailureOf", () => {
  it("reads a request the network lost as unreachable", () => {
    expect(deckBuildFailureOf(new TypeError("Failed to fetch"))).toBe(
      "unreachable"
    );
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
    ["the stream's error event", new Error("AI deck build failed")],
    ["a stream cut short", new Error("The AI build ended early")],
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
