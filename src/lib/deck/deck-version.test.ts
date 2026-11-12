import { describe, expect, it } from "vitest";

import { deckCard, type FakeDeckCard } from "@/test/playtest-db-fake";
import { findSnapshotOfVersion, snapshotContent } from "./deck-version";

const DECK = [
  deckCard("Atraxa, Praetors' Voice", { isCommander: true }),
  deckCard("Sol Ring"),
  deckCard("Forest", { quantity: 10 }),
  deckCard("Swords to Plowshares", { zone: "sideboard" }),
];

/**
 * @param id - Snapshot id.
 * @param cards - Card rows the snapshot stored.
 * @returns A stored snapshot as the database returns it.
 */
function snapshot(id: string, cards: readonly FakeDeckCard[]) {
  return { id, cardList: JSON.parse(JSON.stringify(cards)) };
}

/**
 * @param name - Card to change.
 * @param change - Columns to overwrite on that card.
 * @returns {@link DECK} with one card changed.
 */
function deckWith(
  name: string,
  change: Partial<FakeDeckCard>
): readonly FakeDeckCard[] {
  return DECK.map((card) =>
    card.name === name ? { ...card, ...change } : card
  );
}

describe("findSnapshotOfVersion", () => {
  it("finds the snapshot holding the same cards, in any row order", () => {
    const reordered = [...DECK].reverse();
    expect(
      findSnapshotOfVersion("deck-1", DECK, [snapshot("snap-1", reordered)])
    ).toBe("snap-1");
  });

  it("returns the newest match when several snapshots hold the same version", () => {
    const snapshots = [snapshot("newest", DECK), snapshot("older", DECK)];
    expect(findSnapshotOfVersion("deck-1", DECK, snapshots)).toBe("newest");
  });

  it("skips newer snapshots of other versions to find an earlier one", () => {
    const edited = deckWith("Sol Ring", { name: "Arcane Signet" });
    const snapshots = [snapshot("edited", edited), snapshot("original", DECK)];
    expect(findSnapshotOfVersion("deck-1", DECK, snapshots)).toBe("original");
  });

  it.each([
    ["a card swapped", deckWith("Sol Ring", { name: "Arcane Signet" })],
    ["a quantity changed", deckWith("Forest", { quantity: 9 })],
    [
      "a card moved to another zone",
      deckWith("Swords to Plowshares", { zone: "main" }),
    ],
    [
      "another commander",
      deckWith("Atraxa, Praetors' Voice", { isCommander: false }),
    ],
    ["a partner added", deckWith("Sol Ring", { isPartner: true })],
    ["a card removed", DECK.slice(1)],
  ])("treats %s as a different version", (_change, cards) => {
    expect(
      findSnapshotOfVersion("deck-1", cards, [snapshot("snap-1", DECK)])
    ).toBeNull();
  });

  it("ignores printing, category, notes and price, which do not change how the deck plays", () => {
    const restyled = deckWith("Sol Ring", {
      scryfallId: "another-printing",
      imageUri: "https://example.test/sol-ring.jpg",
      category: "ramp",
      notes: "Always keep",
      price: 1.5,
    });
    expect(
      findSnapshotOfVersion("deck-1", restyled, [snapshot("snap-1", DECK)])
    ).toBe("snap-1");
  });

  it("adds up rows of the same card, so two printings of a basic land are one card", () => {
    const split = [
      ...DECK.filter((card) => card.name !== "Forest"),
      deckCard("Forest", {
        id: "forest-a",
        scryfallId: "forest-a",
        quantity: 6,
      }),
      deckCard("Forest", {
        id: "forest-b",
        scryfallId: "forest-b",
        quantity: 4,
      }),
    ];
    expect(
      findSnapshotOfVersion("deck-1", split, [snapshot("snap-1", DECK)])
    ).toBe("snap-1");
  });

  it("reads a snapshot saved before zones existed as a main-deck list", () => {
    const mainOnly = DECK.filter((card) => card.zone === "main");
    const legacy = {
      id: "legacy",
      cardList: mainOnly.map(({ zone: _zone, ...card }) => card),
    };
    expect(findSnapshotOfVersion("deck-1", mainOnly, [legacy])).toBe("legacy");
  });

  it("never matches a snapshot whose card list cannot be read", () => {
    const snapshots = [
      { id: "not-a-list", cardList: { cards: DECK } },
      { id: "nameless-card", cardList: [{ quantity: 1 }] },
    ];
    expect(findSnapshotOfVersion("deck-1", DECK, snapshots)).toBeNull();
  });
});

describe("snapshotContent", () => {
  it("stores every card row with the commander's name and the row count", () => {
    expect(
      snapshotContent({ commanderId: "commander-row", cards: DECK })
    ).toEqual({
      cardList: JSON.parse(JSON.stringify(DECK)),
      commander: "Atraxa, Praetors' Voice",
      cardCount: 4,
    });
  });

  it("labels a deck without a commander card by its partner, then its commander id", () => {
    const partnerOnly = [
      deckCard("Thrasios, Triton Hero", { isPartner: true }),
    ];
    expect(
      snapshotContent({ commanderId: "commander-row", cards: partnerOnly })
        .commander
    ).toBe("Thrasios, Triton Hero");
    expect(
      snapshotContent({ commanderId: "commander-row", cards: [] }).commander
    ).toBe("commander-row");
    expect(
      snapshotContent({ commanderId: null, cards: [] }).commander
    ).toBeNull();
  });
});
