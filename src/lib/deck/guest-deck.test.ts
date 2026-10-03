import { describe, expect, it } from "vitest";
import { createEmptyDeck } from "./store-factories";
import {
  GUEST_DECK_ID,
  deserializeGuestDeck,
  serializeGuestDeck,
} from "./guest-deck";

describe("guest deck storage", () => {
  it("round-trips the single browser deck and restores dates", () => {
    const deck = createEmptyDeck(GUEST_DECK_ID, "Guest Deck");
    deck.description = "Stored only in this browser";

    const restored = deserializeGuestDeck(serializeGuestDeck(deck));

    expect(restored).toMatchObject({
      id: GUEST_DECK_ID,
      name: "Guest Deck",
      description: "Stored only in this browser",
    });
    expect(restored?.createdAt).toBeInstanceOf(Date);
    expect(restored?.updatedAt).toBeInstanceOf(Date);
  });

  it("rejects malformed and non-guest data", () => {
    expect(deserializeGuestDeck("not-json")).toBeNull();
    expect(
      deserializeGuestDeck(JSON.stringify({ id: "another-deck" }))
    ).toBeNull();
  });
});
