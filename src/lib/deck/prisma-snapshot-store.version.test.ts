// @vitest-environment node
/**
 * A snapshot restore and the deck repository's card writes over one set of
 * `Deck` and `DeckCard` tables (`@/test/deck-cards-db-fake`, which stores a
 * `$transaction` only when its callback resolves).
 *
 * Why: a restore replaces every card row of the deck. A tab that read the
 * deck before it must be refused on its next card write, as after any other
 * card write, or that write lands on a deck the tab never saw (I-01). The
 * restore therefore moves the deck to its next version in the transaction
 * that replaces the rows; this suite pins the refusal and the rollback.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { prismaDeckRepository } from "@/lib/deck/deck-repository";
import { prismaSnapshotStore } from "@/lib/deck/prisma-snapshot-store";
import { restoredDeck } from "@/lib/deck/snapshot-restore";
import { newDeckCard } from "@/lib/deck/testing/deck-repository-contract";
import { CARDS_DECK, deckCardsDb } from "@/test/deck-cards-db-fake";
import { deckCard } from "@/test/playtest-db-fake";
import { stubPrisma } from "@/test/prisma-stub";

const SAVED_CARDS = [
  deckCard("Sol Ring"),
  deckCard("Forest", { quantity: 10 }),
];
const SNAPSHOT = restoredDeck(CARDS_DECK.id, [deckCard("Arcane Signet")]);
const COMMAND_TOWER = newDeckCard("Command Tower", { category: "land" });

/** @returns the snapshot store and the deck repository on one stubbed client */
function adapters() {
  const client = stubPrisma({ prisma }, deckCardsDb.prisma).prisma;
  return {
    snapshots: prismaSnapshotStore(client),
    cards: prismaDeckRepository(client),
  };
}

/** @returns the stored card names, in order */
function storedNames(): readonly string[] {
  return deckCardsDb.cards().map((card) => card.name);
}

describe("a snapshot restore under the deck's optimistic lock", () => {
  beforeEach(() => {
    deckCardsDb.reset(SAVED_CARDS);
  });

  it("refuses as stale a card write that read the deck before the restore", async () => {
    const { snapshots, cards } = adapters();
    const readBefore = CARDS_DECK.version;

    await snapshots.restoreDeck(CARDS_DECK.id, SNAPSHOT);
    const write = await cards.addCard(
      { deckId: CARDS_DECK.id, expectedVersion: readBefore },
      COMMAND_TOWER
    );

    expect(write).toEqual({ kind: "stale" });
    expect(storedNames()).toEqual(["Arcane Signet"]);
  });

  it("accepts a card write that read the deck after the restore", async () => {
    const { snapshots, cards } = adapters();

    await snapshots.restoreDeck(CARDS_DECK.id, SNAPSHOT);
    const write = await cards.addCard(
      { deckId: CARDS_DECK.id, expectedVersion: CARDS_DECK.version + 1 },
      COMMAND_TOWER
    );

    expect(write).toEqual(
      expect.objectContaining({
        kind: "saved",
        version: CARDS_DECK.version + 2,
      })
    );
  });

  it("keeps the version and the old rows when the rows fail to insert", async () => {
    const { snapshots } = adapters();
    deckCardsDb.failNextCardInsert();

    await expect(
      snapshots.restoreDeck(CARDS_DECK.id, SNAPSHOT)
    ).rejects.toThrow("card insert failed");

    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version);
    expect(storedNames()).toEqual(["Sol Ring", "Forest"]);
  });

  it("keeps the old rows when the version step fails", async () => {
    const { snapshots } = adapters();
    deckCardsDb.failNextDeckTouch();

    await expect(
      snapshots.restoreDeck(CARDS_DECK.id, SNAPSHOT)
    ).rejects.toThrow("deck update failed");

    expect(deckCardsDb.deck().version).toBe(CARDS_DECK.version);
    expect(storedNames()).toEqual(["Sol Ring", "Forest"]);
  });
});
