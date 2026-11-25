/**
 * What the snapshot use cases need from storage: a deck's saved snapshots,
 * its card rows, and the writes that save, delete and restore a snapshot.
 *
 * Deck-building context, types only: no framework or database import, so the
 * use cases in `snapshot-use-cases.ts` and `snapshot-of-saved-deck.ts` run in
 * Vitest on the fake in `testing/in-memory-snapshot-store.ts`.
 * Implementations: `prismaSnapshotStore` and `prismaDeckVersionStore` in
 * `prisma-snapshot-store.ts`. Both pass the contract suite in
 * `testing/snapshot-store-contract.ts`. The file moves to
 * `modules/deck-building/application/` with DB-19.
 *
 * Two ports, not one: the snapshot routes need the whole list and the
 * writes, while recording a playtest needs only the version match, inside
 * the recording's own transaction.
 *
 * @module deck/snapshot-store-port
 */
import type {
  CapturableCard,
  CapturableDeck,
  SnapshotContent,
  VersionedSnapshot,
} from "@/lib/deck/deck-version";
import type {
  DeckCommanders,
  RestoredDeck,
} from "@/lib/deck/snapshot-restore";

/** One saved snapshot as the history list shows it, without its card list. */
export interface SnapshotSummary {
  readonly id: string;
  readonly name: string;
  /** The commander's name when the snapshot was taken, or null. */
  readonly commander: string | null;
  /**
   * The cards the snapshot holds, counted as the deck list counts a deck
   * (`countStoredCardCopies`): every main-zone copy, plus the commander and
   * the partner; the sideboard, Considering and the companion stay out. Ten
   * Forests in one row count ten. Read from the card list by
   * `snapshotCardCopies`, so a snapshot saved when the column held its row
   * count reads its copies too.
   */
  readonly cardCount: number;
  readonly createdAt: Date;
}

/**
 * One saved snapshot as storage lists it: the summary columns and the stored
 * card list its count is read from. `cardCount` is the stored column: copies
 * for a snapshot saved since copies were counted, rows for an older one.
 */
export interface ListedSnapshot extends SnapshotSummary {
  /** The `DeckSnapshot.cardList` JSON, read back by `restoredDeckCards`. */
  readonly cardList: unknown;
}

/** One saved snapshot, with the deck it belongs to and its stored card list. */
export interface StoredSnapshot extends ListedSnapshot {
  readonly deckId: string;
}

/** A snapshot to store: its deck, its name and the captured card list. */
export interface NewSnapshot extends SnapshotContent {
  readonly deckId: string;
  readonly name: string;
}

/**
 * A deck with its saved card rows. The adapter answers the whole row, which
 * the routes return as JSON; the type names only what the use cases read.
 */
export interface DeckWithCards extends CapturableDeck, DeckCommanders {
  readonly id: string;
  /** The companion row's Scryfall id, or null without a companion. */
  readonly companionId: string | null;
  /**
   * The deck's optimistic-lock counter (`Deck.version`), which every card
   * write steps (`deck-repository.ts`). A restore steps it too.
   */
  readonly version: number;
}

/**
 * The snapshots of the decks, as the snapshot routes use them.
 *
 * An implementation guarantees:
 * - `listSummaries` answers the deck's snapshots, newest first, each with
 *   its stored card list, so the use case can count its cards;
 * - `findDeckWithCards` and `findInDeck` answer null when nothing matches;
 *   `findInDeck` never answers a snapshot of another deck;
 * - `create` stores the snapshot and answers the stored row;
 * - `restoreDeck` replaces every card row of the deck, writes the deck
 *   fields `restoredDeckFields` names (commander fields, and the companion
 *   when the snapshot recorded it) and moves the deck to its next version,
 *   all or nothing. The step is unconditional: a restore is a whole-deck
 *   action that takes no version from the client, and it exists so that a
 *   tab still holding the old version is refused on its next card write;
 * - each throws whatever the database throws when it is unavailable.
 *
 * Not responsible for who may act: the routes check the owner first.
 */
export interface SnapshotStore {
  listSummaries(deckId: string): Promise<readonly ListedSnapshot[]>;
  findDeckWithCards(deckId: string): Promise<DeckWithCards | null>;
  create(snapshot: NewSnapshot): Promise<StoredSnapshot>;
  findInDeck(
    deckId: string,
    snapshotId: string
  ): Promise<StoredSnapshot | null>;
  remove(snapshotId: string): Promise<void>;
  restoreDeck(deckId: string, restored: RestoredDeck): Promise<void>;
}

/**
 * The reads and the one write that file a recorded playtest under a deck
 * version, bound to the recording's transaction.
 *
 * An implementation guarantees:
 * - `listCards` answers the deck's saved card rows, whole;
 * - `listRecentSnapshots` answers at most `limit` snapshots of the deck,
 *   newest first;
 * - `createSnapshot` stores the snapshot and answers its id.
 */
export interface DeckVersionStore {
  listCards(deckId: string): Promise<readonly CapturableCard[]>;
  listRecentSnapshots(
    deckId: string,
    limit: number
  ): Promise<readonly VersionedSnapshot[]>;
  createSnapshot(snapshot: NewSnapshot): Promise<string>;
}
