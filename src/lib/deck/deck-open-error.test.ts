/**
 * The policy that tells a deck the server does not have from a deck that failed to load (I-01).
 * The builder page's own tests show both states end to end; these pin the edges.
 */
import { describe, expect, it } from "vitest";
import { DeckApiError } from "@/lib/db/deck-api-answer";
import {
  deckOpenErrorFrom,
  failureToRetry,
  type DeckOpenError,
} from "./deck-open-error";

describe("deckOpenErrorFrom", () => {
  it("reads a 404 answer as a deck the server does not have", () => {
    const error = new DeckApiError("fetchDeck", 404, "Deck not found");

    expect(deckOpenErrorFrom("deck-1", error)).toEqual({
      deckId: "deck-1",
      kind: "not-found",
      reason: "[fetchDeck] HTTP 404: Deck not found",
    });
  });

  it("reads any other status as a failure a retry may fix", () => {
    const error = new DeckApiError("fetchDeck", 500, "Failed to fetch deck");

    expect(deckOpenErrorFrom("deck-1", error).kind).toBe("failed");
  });

  it("reads a network error as a failure a retry may fix", () => {
    expect(
      deckOpenErrorFrom("deck-1", new TypeError("Failed to fetch"))
    ).toEqual({
      deckId: "deck-1",
      kind: "failed",
      reason: "Failed to fetch",
    });
  });

  it("gives a reason when what was thrown is not an Error", () => {
    expect(deckOpenErrorFrom("deck-1", "boom").reason).toBe(
      "Failed to open deck"
    );
  });
});

describe("failureToRetry", () => {
  const failed: DeckOpenError = {
    deckId: "deck-1",
    kind: "failed",
    reason: "offline",
  };
  const missing: DeckOpenError = {
    deckId: "deck-1",
    kind: "not-found",
    reason: "[fetchDeck] HTTP 404",
  };

  it("offers no retry for a deck the server does not have, even when the listing failed too", () => {
    expect(failureToRetry(missing, "listing down")).toBeNull();
  });

  it("retries the deck's own failure before the listing's", () => {
    expect(failureToRetry(failed, "listing down")).toBe("offline");
  });

  it("retries the listing's failure when the deck itself did not fail", () => {
    expect(failureToRetry(null, "listing down")).toBe("listing down");
    expect(failureToRetry(null, null)).toBeNull();
  });
});
