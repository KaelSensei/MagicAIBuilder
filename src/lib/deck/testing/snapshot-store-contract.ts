/**
 * The shared contract suites of the snapshot ports (ADR 0005: one suite per
 * owned port, run against the in-memory fake and the Prisma adapter). Each is
 * a table of named cases, {@link SNAPSHOT_STORE_CONTRACT_CASES} and
 * {@link DECK_VERSION_STORE_CONTRACT_CASES}; each caller registers one `it`
 * per case.
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
import { expect } from "vitest";

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

/**
 * One expectation of a snapshot port contract: a behaviour sentence, the deck
 * it starts from, and the check that proves it.
 */
export interface SnapshotStoreContractCase {
  /** The test name each contract test file registers the case under. */
  readonly name: string;
  /** The card rows the harness's deck holds before the case runs, whole rows as `deckCard` makes them. */
  readonly deckCards: readonly FakeDeckCard[];
  /** Calls the ports of a fresh harness over `deckCards` and asserts; rejects on a broken contract. */
  readonly run: (harness: SnapshotStoreHarness) => Promise<void>;
}

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
 * Every case of the `SnapshotStore` contract, in the order the test files
 * register them.
 *
 * Each test file declares its own `it` per case, building a fresh harness for
 * each, so the tests are visible in the file that runs them: SonarCloud
 * (S2187, S2699) and a reader both see a test file with tests and an
 * assertion, not a single call into a shared `describe`.
 */
export const SNAPSHOT_STORE_CONTRACT_CASES: readonly SnapshotStoreContractCase[] =
  [
    {
      name: "reads the deck with its saved card rows, and null for a deck it does not hold",
      deckCards: [SOL_RING, FORESTS],
      run: async ({ deckId, snapshots }) => {
        const deck = await snapshots.findDeckWithCards(deckId);

        expect(deck?.id).toBe(deckId);
        expect(names(deck?.cards ?? [])).toEqual(["Sol Ring", "Forest"]);
        expect(await snapshots.findDeckWithCards(OTHER_DECK_ID)).toBeNull();
      },
    },
    {
      name: "answers a created snapshot whole and reads it back through its deck",
      deckCards: [SOL_RING],
      run: async ({ deckId, snapshots }) => {
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
      },
    },
    {
      name: "lists the deck's snapshots newest first, and only that deck's",
      deckCards: [SOL_RING],
      run: async ({ deckId, snapshots }) => {
        await snapshots.create(newSnapshot(deckId, "First"));
        await snapshots.create(newSnapshot(OTHER_DECK_ID, "Elsewhere"));
        await snapshots.create(newSnapshot(deckId, "Second"));

        const listed = await snapshots.listSummaries(deckId);

        expect(listed.map((snapshot) => snapshot.name)).toEqual([
          "Second",
          "First",
        ]);
      },
    },
    {
      name: "never finds a snapshot through another deck, nor an unknown id",
      deckCards: [SOL_RING],
      run: async ({ deckId, snapshots }) => {
        const elsewhere = await snapshots.create(
          newSnapshot(OTHER_DECK_ID, "Elsewhere")
        );

        expect(await snapshots.findInDeck(deckId, elsewhere.id)).toBeNull();
        expect(await snapshots.findInDeck(deckId, "missing")).toBeNull();
      },
    },
    {
      name: "removes a snapshot",
      deckCards: [SOL_RING],
      run: async ({ deckId, snapshots }) => {
        const doomed = await snapshots.create(newSnapshot(deckId, "Doomed"));

        await snapshots.remove(doomed.id);

        expect(await snapshots.findInDeck(deckId, doomed.id)).toBeNull();
        expect(await snapshots.listSummaries(deckId)).toEqual([]);
      },
    },
    {
      name: "replaces every card row of the deck with the given ones",
      deckCards: [SOL_RING, FORESTS],
      run: async ({ deckId, snapshots }) => {
        const restored = restoredDeckCards(deckId, [ARCANE_SIGNET, FORESTS]);

        await snapshots.replaceCards(deckId, restored);

        const deck = await snapshots.findDeckWithCards(deckId);
        expect(names(deck?.cards ?? [])).toEqual(["Arcane Signet", "Forest"]);
        expect(deck?.cards[1]).toEqual(
          expect.objectContaining({ zone: "sideboard", quantity: 10 })
        );
      },
    },
    {
      name: "leaves the deck without cards when the replacement is empty",
      deckCards: [SOL_RING],
      run: async ({ deckId, snapshots }) => {
        await snapshots.replaceCards(deckId, []);

        expect((await snapshots.findDeckWithCards(deckId))?.cards).toEqual([]);
      },
    },
  ];

/**
 * Every case of the `DeckVersionStore` contract, in the order the test files
 * register them. Registered the same way as
 * {@link SNAPSHOT_STORE_CONTRACT_CASES}.
 */
export const DECK_VERSION_STORE_CONTRACT_CASES: readonly SnapshotStoreContractCase[] =
  [
    {
      name: "reads the deck's saved card rows",
      deckCards: [SOL_RING, FORESTS],
      run: async ({ deckId, versions }) => {
        expect(names(await versions.listCards(deckId))).toEqual([
          "Sol Ring",
          "Forest",
        ]);
      },
    },
    {
      name: "lists at most `limit` of the deck's snapshots, newest first, with their card lists",
      deckCards: [SOL_RING],
      run: async ({ deckId, versions }) => {
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
      },
    },
  ];
