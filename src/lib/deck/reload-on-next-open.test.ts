import { describe, expect, it } from "vitest";
import { withDeckToReload } from "@/lib/deck/reload-on-next-open";
import { deckCardCount, isDeckStub } from "@/lib/deck/store-factories";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";

const COMMANDER = aDeckCard({ id: "kaalia-row", name: "Kaalia of the Vast" });

describe("withDeckToReload", () => {
  it("turns a deck held with its rows into a stub the next open reads again", () => {
    const kaalia = aDeck({
      id: "kaalia",
      commander: COMMANDER,
      cards: [aDeckCard({ id: "sol-ring", name: "Sol Ring" })],
      cardRowCount: 2,
      version: 7,
    });

    const held = withDeckToReload({ kaalia }, "kaalia").kaalia;

    expect(isDeckStub(held)).toBe(true);
    expect(held.commander).toEqual(COMMANDER);
    expect(held.cards).toEqual([]);
    expect(held.version).toBeUndefined();
  });

  it("keeps the card count the deck list shows", () => {
    const kaalia = aDeck({
      id: "kaalia",
      commander: COMMANDER,
      cards: [aDeckCard({ id: "forest", name: "Forest", quantity: 30 })],
      cardRowCount: 2,
    });

    const held = withDeckToReload({ kaalia }, "kaalia").kaalia;

    expect(deckCardCount(held)).toBe(31);
  });

  it("makes an empty deck a stub too, since the add gave it a row", () => {
    const empty = aDeck({ id: "empty" });

    expect(isDeckStub(withDeckToReload({ empty }, "empty").empty)).toBe(true);
  });

  it("leaves a deck it does not hold, and the other decks, as they were", () => {
    const other = aDeck({ id: "other", cards: [aDeckCard()], cardRowCount: 1 });

    expect(withDeckToReload({ other }, "kaalia")).toEqual({ other });
  });
});
