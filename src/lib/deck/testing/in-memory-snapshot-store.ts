/**
 * In-memory fakes of the snapshot ports for tests (ADR 0005: owned ports get
 * a hand-written fake). It passes the contract suite in
 * `snapshot-store-contract.ts`, run by `in-memory-snapshot-store.test.ts`.
 *
 * One deck, its card rows and its snapshots, shared by both ports, so a test
 * can save a snapshot through `snapshots` and see a recorded playtest match
 * it through `versions`. Each new snapshot is stamped one second after the
 * previous one, so "newest first" is never a tie. A card list is stored as a
 * structured clone, as a JSON column would keep it.
 *
 * @module deck/testing/in-memory-snapshot-store
 */
import type { DeckVersionCard } from "@/lib/deck/deck-version";
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
export interface InMemoryDeck {
  readonly id: string;
  readonly commanderId: string | null;
}

/** Both ports over one in-memory deck, plus the switches a test turns. */
export interface InMemorySnapshotStore {
  readonly snapshots: SnapshotStore;
  readonly versions: DeckVersionStore;
  /** Replaces the deck's saved card rows, as an edit in the builder would. */
  readonly saveCards: (cards: readonly DeckVersionCard[]) => void;
  /** Deletes the deck, as another tab could between two requests. */
  readonly deleteDeck: () => void;
  /** @returns every stored snapshot, oldest first */
  readonly storedSnapshots: () => readonly StoredSnapshot[];
  /** @returns the deck's saved card rows */
  readonly savedCards: () => readonly DeckVersionCard[];
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
  cards: readonly DeckVersionCard[]
): InMemorySnapshotStore {
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
      ? { ...deck, cards: [...savedCards] }
      : null;

  const remove = (snapshotId: string): void => {
    stored = stored.filter((snapshot) => snapshot.id !== snapshotId);
  };

  const replaceCards = (
    deckId: string,
    restored: readonly DeckVersionCard[]
  ): void => {
    if (deckId === deck.id) savedCards = [...restored];
  };

  const snapshots: SnapshotStore = {
    listSummaries: (deckId) =>
      Promise.resolve(
        newestFirst(deckId).map(
          ({ id, name, commander, cardCount, createdAt }) => ({
            id,
            name,
            commander,
            cardCount,
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
    remove: (snapshotId) => Promise.resolve(remove(snapshotId)),
    replaceCards: (deckId, restored) =>
      Promise.resolve(replaceCards(deckId, restored)),
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
