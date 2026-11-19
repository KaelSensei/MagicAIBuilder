/**
 * The shared contract suites of the snapshot ports (ADR 0005: one suite per
 * owned port, run against the in-memory fake and the Prisma adapter).
 *
 * `SnapshotStore`: a deck is read with its saved card rows; a stored
 * snapshot reads back whole; the list is newest first and holds only that
 * deck's snapshots; a snapshot is never found through another deck; a delete
 * removes it; a card replacement leaves exactly the new rows.
 * `DeckVersionStore`: the saved rows read back; the recent snapshots are
 * newest first, that deck's only, and at most `limit`; a created snapshot is
 * the newest. Callers: `in-memory-snapshot-store.test.ts` and
 * `prisma-snapshot-store.test.ts`.
 *
 * What it leaves to the routes' suites: the exact Prisma arguments, such as
 * the history list leaving out the card list, which the in-memory Prisma
 * tables ignore.
 *
 * @module deck/testing/snapshot-store-contract
 */
import { describe, expect, it } from "vitest";

import type { DeckVersionCard } from "@/lib/deck/deck-version";
import { restoredDeckCards } from "@/lib/deck/snapshot-restore";
import type {
  DeckVersionStore,
  NewSnapshot,
  SnapshotStore,
} from "@/lib/deck/snapshot-store-port";
import { deckCard, type FakeDeckCard } from "@/test/playtest-db-fake";

/** Both ports over one deck that holds `cards`, as an implementation builds them. */
export interface SnapshotStoreHarness {
  readonly deckId: string;
  readonly snapshots: SnapshotStore;
  readonly versions: DeckVersionStore;
}

/** Builds a fresh harness whose deck holds `cards`, whole rows as `deckCard` makes them. */
export type SnapshotStoreHarnessFactory = (
  cards: readonly FakeDeckCard[]
) => SnapshotStoreHarness;

/** A deck no harness holds. */
const OTHER_DECK_ID = "deck-elsewhere";

const SOL_RING = deckCard("Sol Ring");
const ARCANE_SIGNET = deckCard("Arcane Signet");
const FORESTS = deckCard("Forest", { quantity: 10, zone: "sideboard" });

/** @returns a snapshot of `deckId` named `name`, holding `cards` */
function newSnapshot(
  deckId: string,
  name: string,
  cards: readonly DeckVersionCard[] = [SOL_RING]
): NewSnapshot {
  return {
    deckId,
    name,
    cardList: cards.map((card) => ({ ...card })),
    commander: null,
    cardCount: cards.length,
  };
}

/** @returns the card names, in order */
function names(cards: readonly DeckVersionCard[]): readonly string[] {
  return cards.map((card) => card.name);
}

/**
 * Registers the `SnapshotStore` contract.
 *
 * @param build - Makes a fresh harness for each test.
 */
export function describeSnapshotStoreContract(
  build: SnapshotStoreHarnessFactory
): void {
  describe("SnapshotStore contract", () => {
    it("reads the deck with its saved card rows, and null for a deck it does not hold", async () => {
      const { deckId, snapshots } = build([SOL_RING, FORESTS]);

      const deck = await snapshots.findDeckWithCards(deckId);

      expect(deck?.id).toBe(deckId);
      expect(names(deck?.cards ?? [])).toEqual(["Sol Ring", "Forest"]);
      expect(await snapshots.findDeckWithCards(OTHER_DECK_ID)).toBeNull();
    });

    it("answers a created snapshot whole and reads it back through its deck", async () => {
      const { deckId, snapshots } = build([SOL_RING]);

      const created = await snapshots.create(newSnapshot(deckId, "Before"));

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          deckId,
          name: "Before",
          commander: null,
          cardCount: 1,
          createdAt: expect.any(Date),
        })
      );
      const found = await snapshots.findInDeck(deckId, created.id);
      expect(names(restoredDeckCards(deckId, found?.cardList))).toEqual([
        "Sol Ring",
      ]);
    });

    it("lists the deck's snapshots newest first, and only that deck's", async () => {
      const { deckId, snapshots } = build([SOL_RING]);
      await snapshots.create(newSnapshot(deckId, "First"));
      await snapshots.create(newSnapshot(OTHER_DECK_ID, "Elsewhere"));
      await snapshots.create(newSnapshot(deckId, "Second"));

      const listed = await snapshots.listSummaries(deckId);

      expect(listed.map((snapshot) => snapshot.name)).toEqual([
        "Second",
        "First",
      ]);
    });

    it("never finds a snapshot through another deck, nor an unknown id", async () => {
      const { deckId, snapshots } = build([SOL_RING]);
      const elsewhere = await snapshots.create(
        newSnapshot(OTHER_DECK_ID, "Elsewhere")
      );

      expect(await snapshots.findInDeck(deckId, elsewhere.id)).toBeNull();
      expect(await snapshots.findInDeck(deckId, "missing")).toBeNull();
    });

    it("removes a snapshot", async () => {
      const { deckId, snapshots } = build([SOL_RING]);
      const doomed = await snapshots.create(newSnapshot(deckId, "Doomed"));

      await snapshots.remove(doomed.id);

      expect(await snapshots.findInDeck(deckId, doomed.id)).toBeNull();
      expect(await snapshots.listSummaries(deckId)).toEqual([]);
    });

    it("replaces every card row of the deck with the given ones", async () => {
      const { deckId, snapshots } = build([SOL_RING, FORESTS]);
      const restored = restoredDeckCards(deckId, [ARCANE_SIGNET, FORESTS]);

      await snapshots.replaceCards(deckId, restored);

      const deck = await snapshots.findDeckWithCards(deckId);
      expect(names(deck?.cards ?? [])).toEqual(["Arcane Signet", "Forest"]);
      expect(deck?.cards[1]).toEqual(
        expect.objectContaining({ zone: "sideboard", quantity: 10 })
      );
    });

    it("leaves the deck without cards when the replacement is empty", async () => {
      const { deckId, snapshots } = build([SOL_RING]);

      await snapshots.replaceCards(deckId, []);

      expect((await snapshots.findDeckWithCards(deckId))?.cards).toEqual([]);
    });
  });
}

/**
 * Registers the `DeckVersionStore` contract.
 *
 * @param build - Makes a fresh harness for each test.
 */
export function describeDeckVersionStoreContract(
  build: SnapshotStoreHarnessFactory
): void {
  describe("DeckVersionStore contract", () => {
    it("reads the deck's saved card rows", async () => {
      const { deckId, versions } = build([SOL_RING, FORESTS]);

      expect(names(await versions.listCards(deckId))).toEqual([
        "Sol Ring",
        "Forest",
      ]);
    });

    it("lists at most `limit` of the deck's snapshots, newest first, with their card lists", async () => {
      const { deckId, versions } = build([SOL_RING]);
      const first = await versions.createSnapshot(newSnapshot(deckId, "1"));
      await versions.createSnapshot(newSnapshot(OTHER_DECK_ID, "elsewhere"));
      const second = await versions.createSnapshot(newSnapshot(deckId, "2"));
      const third = await versions.createSnapshot(
        newSnapshot(deckId, "3", [ARCANE_SIGNET])
      );

      const recent = await versions.listRecentSnapshots(deckId, 2);

      expect(recent.map((snapshot) => snapshot.id)).toEqual([third, second]);
      expect(recent.map((snapshot) => snapshot.id)).not.toContain(first);
      expect(names(restoredDeckCards(deckId, recent[0].cardList))).toEqual([
        "Arcane Signet",
      ]);
    });
  });
}
