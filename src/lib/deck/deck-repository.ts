/**
 * The deck repository on PostgreSQL: each card write, the deck's `version`
 * step and its `updatedAt` commit in one interactive transaction, behind a
 * compare-and-swap on `Deck.version` (the optimistic lock).
 *
 * Why one transaction: a card lives in `DeckCard`, so Prisma's `@updatedAt`
 * on `Deck` does not move when a card changes. The card write and the deck
 * update used to be two statements, and a failed second one left the card
 * stored under the old timestamp (B2-09, fixed by #1393 with
 * `writeDeckCards`, which this module replaces). Why the version: two tabs, or
 * two devices, editing one deck overwrote each other silently. A writer that
 * names the version it read is now refused when another write landed first
 * (docs/architecture/target-structure.md, step 5).
 *
 * Callers: the single-card handlers of `/api/decks/[id]/cards` and
 * `/api/decks/[id]/cards/[cardId]`, the command-zone handler
 * `PATCH /api/decks/[id]/command-zone`, whose row changes and deck fields
 * used to be three browser requests that could each fail on their own, and
 * the bulk edit `PATCH /api/decks/[id]/cards`, which used to keep its own
 * transaction outside the version. The other deck writes (the metadata
 * PATCH, deck creation, imports) do not move the version.
 * Port and contract: `deck-repository-port.ts`,
 * `testing/deck-repository-contract.ts`.
 *
 * @module deck/deck-repository
 */
import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

import { forEachSequential } from "@/lib/async/sequential";
import { prisma } from "@/lib/db/prisma";
import { COMMAND_SLOT_ROWS } from "@/lib/deck/bulk-edit-command-zone";
import type { CommandSlot } from "@/lib/deck/bulk-edit-command-zone";
import type {
  BulkEditWrite,
  CommandZoneWrite,
  DeckCardResize,
  DeckRepository,
  DeckWriteResult,
  DeckWriteTarget,
  NewDeckCard,
  StoredDeckCard,
} from "@/lib/deck/deck-repository-port";

type Transaction = Prisma.TransactionClient;

/**
 * A row the write names is not in this deck. Prisma's `deleteMany` and
 * `updateMany` report a count, not an error, so the adapter checks the count
 * and throws this inside the transaction: nothing already written stays.
 */
class MissingRowError extends Error {
  constructor(what: string) {
    super(`A card to ${what} is not in this deck`);
    this.name = "MissingRowError";
  }
}

/** Whether this write may proceed, and the version it gives the deck. */
type VersionClaim =
  | { readonly kind: "claimed"; readonly version: number }
  | { readonly kind: "stale" }
  | { readonly kind: "not-found" };

/**
 * Moves the deck to its next version, if the writer read the current one.
 *
 * The compare and the swap are one `UPDATE … WHERE id = $1 AND version = $2`.
 * PostgreSQL locks the row it updates until the transaction ends; a second
 * writer's `UPDATE` waits on that lock, then re-checks its `WHERE` against
 * the committed row (READ COMMITTED, "13.2.1 Read Committed Isolation Level",
 * https://www.postgresql.org/docs/16/transaction-iso.html, read 2026-11-11).
 * So of two writers that read the same version, exactly one matches. The
 * lock also queues the card writes of one deck behind each other.
 *
 * `expectedVersion: undefined` is no filter in Prisma, so an unchecked write
 * matches the deck whatever its version.
 */
async function claimNextVersion(
  tx: Transaction,
  target: DeckWriteTarget
): Promise<VersionClaim> {
  const claimed = await tx.deck.updateMany({
    where: { id: target.deckId, version: target.expectedVersion },
    data: { version: { increment: 1 }, updatedAt: new Date() },
  });
  // Read after the update: it holds the row lock, so this is our version.
  const deck = await tx.deck.findUnique({
    where: { id: target.deckId },
    select: { version: true },
  });
  if (deck === null) return { kind: "not-found" };
  if (claimed.count === 0) return { kind: "stale" };
  return { kind: "claimed", version: deck.version };
}

/**
 * Runs `write` in the transaction that claims the deck's next version.
 * Nothing is written when the claim fails. When `write` throws, Prisma rolls
 * the transaction back, the version step included, and the promise rejects.
 */
function versionedWrite<Value>(
  client: PrismaClient,
  target: DeckWriteTarget,
  write: (tx: Transaction) => Promise<Value>
): Promise<DeckWriteResult<Value>> {
  return client.$transaction(async (tx): Promise<DeckWriteResult<Value>> => {
    const claim = await claimNextVersion(tx, target);
    if (claim.kind !== "claimed") return claim;
    return { kind: "saved", value: await write(tx), version: claim.version };
  });
}

/** The `create` data of a new row: the port's readonly array made mutable for Prisma. */
function newRow(deckId: string, card: NewDeckCard) {
  return { ...card, colorIdentity: [...card.colorIdentity], deckId };
}

/** Removes the rows named by id. @throws MissingRowError when one is not in this deck */
async function removeRows(
  tx: Transaction,
  deckId: string,
  cardIds: readonly string[]
): Promise<void> {
  if (cardIds.length === 0) return;
  const removed = await tx.deckCard.deleteMany({
    where: { deckId, id: { in: [...cardIds] } },
  });
  if (removed.count !== new Set(cardIds).size) {
    throw new MissingRowError("remove");
  }
}

/**
 * Removes the rows that fill each slot, by role: the browser knows a
 * hand-picked commander only by its printing, and earlier picks can have left
 * more than one row.
 */
function clearSlots(
  tx: Transaction,
  deckId: string,
  slots: readonly CommandSlot[]
): Promise<void> {
  return forEachSequential(slots, (slot) =>
    tx.deckCard.deleteMany({ where: { deckId, ...COMMAND_SLOT_ROWS[slot] } })
  );
}

/** Sets each row's copies. @throws MissingRowError when a row is not in this deck */
function resizeRows(
  tx: Transaction,
  deckId: string,
  changes: readonly DeckCardResize[]
): Promise<void> {
  return forEachSequential(changes, async ({ cardId, quantity }) => {
    const resized = await tx.deckCard.updateMany({
      where: { id: cardId, deckId },
      data: { quantity },
    });
    if (resized.count !== 1) throw new MissingRowError("resize");
  });
}

/** Adds the rows one by one, so the stored rows come back in the order given. */
async function addRows(
  tx: Transaction,
  deckId: string,
  cards: readonly NewDeckCard[]
): Promise<readonly StoredDeckCard[]> {
  const added: StoredDeckCard[] = [];
  await forEachSequential(cards, async (card) => {
    added.push(await tx.deckCard.create({ data: newRow(deckId, card) }));
  });
  return added;
}

/**
 * Writes a command-zone change inside the transaction that claimed the
 * version: the deck fields first, then the rows that leave, then the rows
 * that enter. A throw at any step rolls the whole change back.
 *
 * @returns the added rows, in the order they were given
 * @throws MissingRowError when the deck holds no row for one of `removeCardIds`
 */
async function writeCommandZone(
  tx: Transaction,
  deckId: string,
  write: CommandZoneWrite
): Promise<readonly StoredDeckCard[]> {
  await tx.deck.update({ where: { id: deckId }, data: write.fields });
  await removeRows(tx, deckId, write.removeCardIds);
  await clearSlots(tx, deckId, write.clearSlots);
  return addRows(tx, deckId, write.addCards);
}

/**
 * Applies a bulk edit inside the transaction that claimed the version: the
 * command-zone part as `writeCommandZone` stores it, then the resized rows.
 * Resizing after the slots are cleared keeps a resized row that a cleared
 * slot took away a stale copy, as the bulk edit always treated it.
 *
 * @returns every row the deck holds after the edit
 * @throws MissingRowError when the deck holds no row for one of
 *   `removeCardIds` or `quantityChanges`
 */
async function applyBulkEdit(
  tx: Transaction,
  deckId: string,
  edit: BulkEditWrite
): Promise<readonly StoredDeckCard[]> {
  await writeCommandZone(tx, deckId, edit);
  await resizeRows(tx, deckId, edit.quantityChanges);
  return tx.deckCard.findMany({ where: { deckId } });
}

/**
 * The bulk edit's answer to a row it names that the deck does not hold:
 * `stale`, since the edit was planned on an outdated copy (see the port).
 * Prisma has rolled the transaction back by the time the rejection arrives.
 */
function missingRowIsStale(
  error: unknown
): Promise<{ readonly kind: "stale" }> {
  if (error instanceof MissingRowError) {
    return Promise.resolve({ kind: "stale" });
  }
  return Promise.reject(error);
}

/**
 * Builds the repository on a Prisma client.
 *
 * Card rows are matched on `id` and `deckId` together (Prisma 5+ accepts
 * extra columns in a unique `where`), so a card of another deck is "not
 * found": Prisma throws P2025, the transaction rolls back and the call
 * rejects.
 *
 * @param client - The shared client in production; a client on a throwaway
 *   database in the contract test.
 */
export function prismaDeckRepository(client: PrismaClient): DeckRepository {
  return {
    addCard: (target, card) =>
      versionedWrite(client, target, (tx) =>
        tx.deckCard.create({ data: newRow(target.deckId, card) })
      ),
    editCard: (target, cardId, edit) =>
      versionedWrite(client, target, (tx) =>
        tx.deckCard.update({
          where: { id: cardId, deckId: target.deckId },
          data: edit,
        })
      ),
    removeCard: (target, cardId) =>
      versionedWrite(client, target, (tx) =>
        tx.deckCard.delete({ where: { id: cardId, deckId: target.deckId } })
      ),
    removeAllCards: (target) =>
      versionedWrite(client, target, async (tx) => {
        const removed = await tx.deckCard.deleteMany({
          where: { deckId: target.deckId },
        });
        return removed.count;
      }),
    writeCommandZone: (target, write) =>
      versionedWrite(client, target, (tx) =>
        writeCommandZone(tx, target.deckId, write)
      ),
    applyBulkEdit: (target, edit) =>
      versionedWrite(client, target, (tx) =>
        applyBulkEdit(tx, target.deckId, edit)
      ).catch(missingRowIsStale),
  };
}

/** The repository the route handlers use, on the process-wide client. */
export const deckRepository: DeckRepository = prismaDeckRepository(prisma);
