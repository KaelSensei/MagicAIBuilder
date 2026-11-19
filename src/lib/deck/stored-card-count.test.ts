/**
 * The card count of a deck read from its stored rows, against the count the
 * editor makes of the same deck once loaded (`countDeckCards`). The deck list
 * shows the first and the editor the second, so they must agree.
 */
import { describe, expect, it } from "vitest";

import { countDeckCards } from "@/lib/deck/deck-size";
import {
  countStoredCardCopies,
  type StoredCardCopies,
} from "@/lib/deck/stored-card-count";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

/** @returns the stored row of a main-deck, sideboard or maybeboard card */
function storedRow(card: DeckCard): StoredCardCopies {
  return {
    isCommander: false,
    isPartner: false,
    category: card.category,
    zone: card.zone,
    quantity: card.quantity,
  };
}

const COMMANDER_ROW: StoredCardCopies = {
  isCommander: true,
  isPartner: false,
  category: "commander",
  zone: "main",
  quantity: 1,
};

const PARTNER_ROW: StoredCardCopies = {
  isCommander: true,
  isPartner: true,
  category: "commander",
  zone: "main",
  quantity: 1,
};

const COMPANION_ROW: StoredCardCopies = {
  isCommander: false,
  isPartner: false,
  category: "companion",
  zone: "main",
  quantity: 1,
};

describe("countStoredCardCopies", () => {
  it("counts a row of 30 Forests as 30 cards, as the editor does", () => {
    const cards = [
      aDeckCard({ id: "forest", name: "Forest", quantity: 30 }),
      ...Array.from({ length: 69 }, (_, index) =>
        aDeckCard({ id: `spell-${index}` })
      ),
    ];
    const commander = aDeckCard({
      id: "talrand",
      name: "Talrand, Sky Summoner",
    });

    const stored = countStoredCardCopies([
      COMMANDER_ROW,
      ...cards.map(storedRow),
    ]);

    expect(stored).toBe(100);
    expect(stored).toBe(countDeckCards(aDeck({ commander, cards })));
  });

  it("leaves the sideboard, the maybeboard and a companion out, as the editor does", () => {
    const cards = [
      aDeckCard({ id: "island", quantity: 10 }),
      aDeckCard({ id: "negate", zone: "sideboard", quantity: 3 }),
      aDeckCard({ id: "counterspell", zone: "maybeboard", quantity: 2 }),
    ];
    const companion = aDeckCard({ id: "lutri", category: "companion" });

    const stored = countStoredCardCopies([
      COMPANION_ROW,
      ...cards.map(storedRow),
    ]);

    expect(stored).toBe(10);
    expect(stored).toBe(countDeckCards(aDeck({ companion, cards })));
  });

  // CR 702.124a: a partner is a second commander.
  it("counts a commander and a partner as one card each", () => {
    const stored = countStoredCardCopies([
      COMMANDER_ROW,
      PARTNER_ROW,
      storedRow(aDeckCard({ quantity: 98 })),
    ]);

    expect(stored).toBe(100);
  });

  it("counts a command slot once, whatever quantity its row claims", () => {
    expect(countStoredCardCopies([{ ...COMMANDER_ROW, quantity: 3 }])).toBe(1);
  });

  it("adds up rows that share a zone and a category, as a grouped query returns them", () => {
    const stored = countStoredCardCopies([
      storedRow(aDeckCard({ category: "land", quantity: 36 })),
      storedRow(aDeckCard({ category: "land", quantity: 1 })),
    ]);

    expect(stored).toBe(37);
  });

  it("counts a deck with no rows as 0 cards", () => {
    expect(countStoredCardCopies([])).toBe(0);
  });
});
