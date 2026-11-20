/**
 * The four things an owner does with a deck's saved versions: list them,
 * save the deck as a new one, delete one, and restore the deck to one.
 *
 * Deck-building context, application layer (master plan DB-01, server audit
 * S3.5). Each use case runs on the `SnapshotStore` port and answers a
 * discriminated result the routes under `src/app/api/decks/[id]/snapshots`
 * map to status codes. The steps run in the order the routes ran them
 * before this module existed. The HTTP concerns (the owner check, JSON
 * parsing, logging, the 500) stay in the routes; `snapshot-use-cases.server.ts`
 * wires the Prisma store.
 *
 * @module deck/snapshot-use-cases
 */
import { snapshotContent } from "@/lib/deck/deck-version";
import { sanitizeDisplayName } from "@/lib/deck/display-name";
import { snapshotCardCopies } from "@/lib/deck/snapshot-card-count";
import { restoredDeckCards } from "@/lib/deck/snapshot-restore";
import type {
  DeckWithCards,
  ListedSnapshot,
  SnapshotStore,
  SnapshotSummary,
  StoredSnapshot,
} from "@/lib/deck/snapshot-store-port";

/** The longest snapshot name stored, after cleaning. */
export const MAX_SNAPSHOT_NAME_LENGTH = 100;

/** A new snapshot of a deck, under the name the owner typed. */
export interface SaveSnapshotCommand {
  readonly deckId: string;
  /** The name as submitted; the use case cleans it. */
  readonly rawName: string;
}

/** One snapshot of a deck, to delete or to restore. */
export interface SnapshotRef {
  readonly deckId: string;
  readonly snapshotId: string;
}

/**
 * What saving answered: the stored snapshot; `blank-name` when nothing is
 * left of the name once its tags are stripped (400); `deck-not-found` when
 * the deck was deleted after the owner check (404).
 */
export type SaveSnapshotResult =
  | { readonly kind: "saved"; readonly snapshot: StoredSnapshot }
  | { readonly kind: "blank-name" }
  | { readonly kind: "deck-not-found" };

/** What deleting answered; `snapshot-not-found` covers another deck's snapshot (404). */
export type DeleteSnapshotResult =
  { readonly kind: "deleted" } | { readonly kind: "snapshot-not-found" };

/**
 * What restoring answered: the deck as saved after the restore, or null when
 * it vanished in between; `snapshot-not-found` covers another deck's
 * snapshot (404).
 */
export type RestoreSnapshotResult =
  | { readonly kind: "restored"; readonly deck: DeckWithCards | null }
  | { readonly kind: "snapshot-not-found" };

/** The snapshot use cases, bound to one store. */
export interface SnapshotUseCases {
  /** @returns the deck's snapshots, newest first, without their card lists */
  listSnapshots(deckId: string): Promise<readonly SnapshotSummary[]>;
  saveSnapshot(command: SaveSnapshotCommand): Promise<SaveSnapshotResult>;
  deleteSnapshot(ref: SnapshotRef): Promise<DeleteSnapshotResult>;
  /**
   * Replaces the deck's card rows with the snapshot's, all or nothing.
   *
   * @throws when the stored card list cannot be read; the deck is then left
   *   untouched, because the list is parsed before anything is deleted.
   */
  restoreSnapshot(ref: SnapshotRef): Promise<RestoreSnapshotResult>;
}

/**
 * The history row of a listed snapshot: its card list left out, its card
 * count read from that list, so a snapshot saved when the stored count was
 * its rows reads its copies.
 *
 * @param deckId - The deck that owns the snapshot.
 * @param snapshot - The snapshot as the store lists it.
 * @returns The summary the history list shows.
 */
function summaryOf(deckId: string, snapshot: ListedSnapshot): SnapshotSummary {
  return {
    id: snapshot.id,
    name: snapshot.name,
    commander: snapshot.commander,
    cardCount: snapshotCardCopies(deckId, snapshot),
    createdAt: snapshot.createdAt,
  };
}

/**
 * Binds the snapshot use cases to a store.
 *
 * @param store - The snapshot store; the server passes the Prisma one.
 * @returns The four use cases.
 */
export function makeSnapshotUseCases(store: SnapshotStore): SnapshotUseCases {
  return {
    async listSnapshots(deckId) {
      const listed = await store.listSummaries(deckId);
      return listed.map((snapshot) => summaryOf(deckId, snapshot));
    },

    async saveSnapshot({ deckId, rawName }) {
      const name = sanitizeDisplayName(rawName, MAX_SNAPSHOT_NAME_LENGTH);
      if (!name) return { kind: "blank-name" };

      const deck = await store.findDeckWithCards(deckId);
      if (!deck) return { kind: "deck-not-found" };

      const snapshot = await store.create({
        deckId,
        name,
        ...snapshotContent(deck),
      });
      return { kind: "saved", snapshot };
    },

    async deleteSnapshot({ deckId, snapshotId }) {
      const snapshot = await store.findInDeck(deckId, snapshotId);
      if (!snapshot) return { kind: "snapshot-not-found" };

      await store.remove(snapshotId);
      return { kind: "deleted" };
    },

    async restoreSnapshot({ deckId, snapshotId }) {
      const snapshot = await store.findInDeck(deckId, snapshotId);
      if (!snapshot) return { kind: "snapshot-not-found" };

      // Parse before deleting: a malformed list must not wipe the live deck.
      const cards = restoredDeckCards(deckId, snapshot.cardList);
      await store.replaceCards(deckId, cards);
      return { kind: "restored", deck: await store.findDeckWithCards(deckId) };
    },
  };
}
