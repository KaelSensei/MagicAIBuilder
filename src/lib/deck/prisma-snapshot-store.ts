/**
 * The snapshot ports on PostgreSQL: the `DeckSnapshot` and `DeckCard` rows
 * behind `SnapshotStore` and `DeckVersionStore` (`snapshot-store-port.ts`).
 *
 * Each method is the Prisma call the snapshot and playtest-session routes made
 * before DB-01, with the same `where`, `orderBy`, `take`, `select` and
 * `include`, so the routes' Prisma stubs answer it unchanged. Restore deletes
 * and re-creates the card rows and writes the deck's commander fields in one
 * interactive transaction. Both pass the
 * contract suite in `testing/snapshot-store-contract.ts`, run by
 * `prisma-snapshot-store.test.ts`.
 *
 * @module deck/prisma-snapshot-store
 */
import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  DeckVersionStore,
  NewSnapshot,
  SnapshotStore,
} from "@/lib/deck/snapshot-store-port";

/**
 * The columns the history list reads. The card list comes too: the history
 * counts each snapshot's cards from it (`snapshotCardCopies`), because a
 * snapshot saved before copies were counted stored its row count.
 */
const SUMMARY_SELECT = {
  id: true,
  name: true,
  commander: true,
  cardCount: true,
  cardList: true,
  createdAt: true,
} as const;

/**
 * @param snapshot - The snapshot to store.
 * @returns The `data` of `deckSnapshot.create`.
 */
function snapshotData(
  snapshot: NewSnapshot
): Prisma.DeckSnapshotUncheckedCreateInput {
  return {
    deckId: snapshot.deckId,
    name: snapshot.name,
    cardList: snapshot.cardList,
    commander: snapshot.commander,
    cardCount: snapshot.cardCount,
  };
}

/**
 * The snapshot store of the snapshot routes.
 *
 * @param client - The Prisma client; the server passes the shared one.
 * @returns The store.
 */
export function prismaSnapshotStore(client: PrismaClient): SnapshotStore {
  return {
    listSummaries: (deckId) =>
      client.deckSnapshot.findMany({
        where: { deckId },
        orderBy: { createdAt: "desc" },
        select: SUMMARY_SELECT,
      }),

    findDeckWithCards: (deckId) =>
      client.deck.findUnique({
        where: { id: deckId },
        include: { cards: true },
      }),

    create: (snapshot) =>
      client.deckSnapshot.create({ data: snapshotData(snapshot) }),

    findInDeck: (deckId, snapshotId) =>
      client.deckSnapshot.findFirst({ where: { id: snapshotId, deckId } }),

    async remove(snapshotId) {
      await client.deckSnapshot.delete({ where: { id: snapshotId } });
    },

    async restoreDeck(deckId, { cards, commanders }) {
      await client.$transaction(async (tx) => {
        await tx.deckCard.deleteMany({ where: { deckId } });
        if (cards.length > 0) {
          await tx.deckCard.createMany({ data: [...cards] });
        }
        await tx.deck.update({ where: { id: deckId }, data: { ...commanders } });
      });
    },
  };
}

/**
 * The version store a recorded playtest uses, bound to its transaction.
 *
 * @param tx - The recording transaction, so the snapshot and the run are
 *   stored together or not at all.
 * @returns The store.
 */
export function prismaDeckVersionStore(
  tx: Prisma.TransactionClient
): DeckVersionStore {
  return {
    listCards: (deckId) => tx.deckCard.findMany({ where: { deckId } }),

    listRecentSnapshots: (deckId, limit) =>
      tx.deckSnapshot.findMany({
        where: { deckId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, cardList: true },
      }),

    async createSnapshot(snapshot) {
      const created = await tx.deckSnapshot.create({
        data: snapshotData(snapshot),
        select: { id: true },
      });
      return created.id;
    },
  };
}
