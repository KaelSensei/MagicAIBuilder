/**
 * Pins the exact message of `DeckApiError`, which the store's error tests and
 * the logs read as `[operation] HTTP <status>: <detail>`, its 409 reading
 * as a stale-deck refusal and its 401 reading as an ended session.
 */
import { describe, expect, it } from "vitest";

import {
  DeckApiError,
  isSignedOutRefusal,
  isStaleDeckRefusal,
} from "@/lib/db/deck-api-answer";

describe("DeckApiError", () => {
  it("reads `[operation] HTTP <status>: <detail>` when the route sent its own error text", () => {
    const error = new DeckApiError("createDeck", 500, "Failed to create deck");

    expect(error.message).toBe("[createDeck] HTTP 500: Failed to create deck");
    expect(error.name).toBe("DeckApiError");
  });

  it("reads `[operation] HTTP <status>` with no trailing colon when the route sent no error text", () => {
    expect(new DeckApiError("fetchDecks", 503).message).toBe(
      "[fetchDecks] HTTP 503"
    );
    expect(new DeckApiError("fetchDecks", 504, "").message).toBe(
      "[fetchDecks] HTTP 504"
    );
  });
});

describe("isStaleDeckRefusal", () => {
  it("reads only a deck API 409 as a stale-deck refusal", () => {
    expect(isStaleDeckRefusal(new DeckApiError("updateDeck", 409))).toBe(true);
    expect(isStaleDeckRefusal(new DeckApiError("updateDeck", 400))).toBe(false);
    expect(isStaleDeckRefusal(new Error("HTTP 409"))).toBe(false);
  });
});

describe("isSignedOutRefusal", () => {
  it("reads only a deck API 401 as an ended session", () => {
    expect(isSignedOutRefusal(new DeckApiError("createSnapshot", 401))).toBe(
      true
    );
    expect(isSignedOutRefusal(new DeckApiError("createSnapshot", 403))).toBe(
      false
    );
    expect(isSignedOutRefusal(new Error("HTTP 401"))).toBe(false);
  });
});
