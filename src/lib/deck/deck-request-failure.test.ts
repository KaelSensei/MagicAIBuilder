import { describe, expect, it } from "vitest";
import { DeckApiError } from "@/lib/db/deck-api-answer";
import { deckRequestFailureOf } from "@/lib/deck/deck-request-failure";

describe("deckRequestFailureOf", () => {
  it("reads a 401 answer as an ended session", () => {
    expect(
      deckRequestFailureOf(new DeckApiError("createDeck", 401, "Unauthorized"))
    ).toBe("signed-out");
  });

  it.each([
    ["a malformed request (400)", new DeckApiError("createDeck", 400)],
    [
      "a server failure (500)",
      new DeckApiError("createDeck", 500, "Failed to create deck"),
    ],
    ["a network failure", new TypeError("Failed to fetch")],
    ["a thrown value that is not an error", "boom"],
  ])("reads %s as a failure the player can only retry", (_case, error) => {
    expect(deckRequestFailureOf(error)).toBe("failed");
  });
});
