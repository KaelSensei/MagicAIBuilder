/**
 * In-memory fakes of the snapshot ports for tests (ADR 0005: owned ports get
 * a hand-written fake). It passes the contract suite in
 * `snapshot-store-contract.ts`, run by `in-memory-snapshot-store.test.ts`.
 *
 * One deck, its card rows, its version and its snapshots, shared by both
 * ports, so a test can save a snapshot through `snapshots` and see a
 * recorded playtest match it through `versions`. A restore steps the
 * version, as the Prisma adapter does. Each new snapshot is stamped one second after the
 * previous one, so "newest first" is never a tie. A card list is stored as a
 * structured clone, as a JSON column would keep it.
 *
 * @module deck/testing/in-memory-snapshot-store
 */
import type { CapturableCard } from "@/lib/deck/deck-version";
import {
  restoredDeckFields,
  type DeckCommanders,
  type RestoredDeck,
} from "@/lib/deck/snapshot-restore";
import type {
  DeckVersionStore,
  DeckWithCards,
  NewSnapshot,
  SnapshotStore,
  StoredSnapshot,
} from "@/lib/deck/snapshot-store-port";

/** When the first snapshot the fake stores is stamped. */
export const FIRST_SNAPSHOT_AT = new Date("2026-11-09T12:00:00Z");

const ONE_SECOND_MS = 1000;

/** The deck the fake holds, without its card rows. */
export interface InMemoryDeck extends DeckCommanders {
  readonly id: string;
  readonly companionId: string | null;
  /** The deck's optimistic-lock counter; 1 when the test does not care. */
  readonly version?: number;
}

/** Both ports over one in-memory deck, plus the switches a test turns. */
export interface InMemorySnapshotStore {
  readonly snapshots: SnapshotStore;
  readonly versions: DeckVersionStore;
  /** Replaces the deck's saved card rows, as an edit in the builder would. */
  readonly saveCards: (cards: readonly CapturableCard[]) => void;
  /** Deletes the deck, as another tab could between two requests. */
  readonly deleteDeck: () => void;
  /** @returns every stored snapshot, oldest first */
  readonly storedSnapshots: () => readonly StoredSnapshot[];
  /** @returns the deck's saved card rows */
  readonly savedCards: () => readonly CapturableCard[];
}

/**
 * Builds the fake.
 *
 * @param deck - The one deck it stores.
 * @param cards - The deck's saved card rows; pass whole rows when a test
 *   restores a snapshot, since restore needs each card's `scryfallId`.
 * @returns The two ports and the test switches.
 */
export function inMemorySnapshotStore(
  deck: InMemoryDeck,
  cards: readonly CapturableCard[]
): InMemorySnapshotStore {
  let savedDeck = { ...deck, version: deck.version ?? 1 };
  let savedCards = cards;
  let deckExists = true;
  let stored: StoredSnapshot[] = [];

  const store = (snapshot: NewSnapshot): StoredSnapshot => {
    const row: StoredSnapshot = {
      id: `snapshot-${stored.length + 1}`,
      deckId: snapshot.deckId,
      name: snapshot.name,
      commander: snapshot.commander,
      cardCount: snapshot.cardCount,
      cardList: structuredClone(snapshot.cardList),
      createdAt: new Date(
        FIRST_SNAPSHOT_AT.getTime() + stored.length * ONE_SECOND_MS
      ),
    };
    stored = [...stored, row];
    return row;
  };

  const newestFirst = (deckId: string): StoredSnapshot[] =>
    stored.filter((snapshot) => snapshot.deckId === deckId).reverse();

  const findDeckWithCards = (deckId: string): DeckWithCards | null =>
    deckExists && deckId === deck.id
      ? { ...savedDeck, cards: [...savedCards] }
      : null;

  const remove = (snapshotId: string): void => {
    stored = stored.filter((snapshot) => snapshot.id !== snapshotId);
  };

  const restoreDeck = (deckId: string, restored: RestoredDeck): void => {
    if (deckId !== deck.id) return;
    savedCards = [...restored.cards];
    savedDeck = {
      ...savedDeck,
      ...restoredDeckFields(restored),
      version: savedDeck.version + 1,
    };
  };

  const snapshots: SnapshotStore = {
    listSummaries: (deckId) =>
      Promise.resolve(
        newestFirst(deckId).map(
          ({ id, name, commander, cardCount, cardList, createdAt }) => ({
            id,
            name,
            commander,
            cardCount,
            cardList: structuredClone(cardList),
            createdAt,
          })
        )
      ),
    findDeckWithCards: (deckId) => Promise.resolve(findDeckWithCards(deckId)),
    create: (snapshot) => Promise.resolve(store(snapshot)),
    findInDeck: (deckId, snapshotId) =>
      Promise.resolve(
        stored.find(
          (snapshot) => snapshot.id === snapshotId && snapshot.deckId === deckId
        ) ?? null
      ),
    remove: (snapshotId) => {
      remove(snapshotId);
      return Promise.resolve();
    },
    restoreDeck: (deckId, restored) => {
      restoreDeck(deckId, restored);
      return Promise.resolve();
    },
  };

  const versions: DeckVersionStore = {
    listCards: (deckId) =>
      Promise.resolve(deckId === deck.id ? [...savedCards] : []),
    listRecentSnapshots: (deckId, limit) =>
      Promise.resolve(
        newestFirst(deckId)
          .slice(0, limit)
          .map(({ id, cardList }) => ({ id, cardList }))
      ),
    createSnapshot: (snapshot) => Promise.resolve(store(snapshot).id),
  };

  return {
    snapshots,
    versions,
    saveCards: (next) => {
      savedCards = next;
    },
    deleteDeck: () => {
      deckExists = false;
    },
    storedSnapshots: () => [...stored],
    savedCards: () => [...savedCards],
  };
}
