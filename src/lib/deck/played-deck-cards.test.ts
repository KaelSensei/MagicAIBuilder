import { describe, expect, it } from "vitest";

import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

import { playedDeckCards } from "./played-deck-cards";

describe("playedDeckCards", () => {
  it("lists the commander, then the partner, then the main-deck rows in their order", () => {
    const commander = aDeckCard({ id: "cmd", name: "Commander" });
    const partner = aDeckCard({ id: "prt", name: "Partner" });
    const solRing = aDeckCard({ id: "sol-ring", name: "Sol Ring" });
    const forest = aDeckCard({ id: "forest", name: "Forest", quantity: 30 });

    const played = playedDeckCards(
      aDeck({ commander, partner, cards: [solRing, forest] })
    );

    expect(played).toEqual([commander, partner, solRing, forest]);
  });

  it("leaves the Sideboard and Considering rows out", () => {
    const solRing = aDeckCard({ id: "sol-ring", name: "Sol Ring" });

    const played = playedDeckCards(
      aDeck({
        cards: [
          aDeckCard({ id: "side", zone: "sideboard" }),
          solRing,
          aDeckCard({ id: "maybe", zone: "maybeboard" }),
        ],
      })
    );

    expect(played).toEqual([solRing]);
  });

  it("is empty for a deck with no commander and no main-deck row", () => {
    const played = playedDeckCards(
      aDeck({ cards: [aDeckCard({ id: "maybe", zone: "maybeboard" })] })
    );

    expect(played).toEqual([]);
  });
});
