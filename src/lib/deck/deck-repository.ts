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
 * `/api/decks/[id]/cards/[cardId]`. Not yet the bulk edit
 * (`PATCH /api/decks/[id]/cards`) nor the other deck writes; until they move
 * here, they do not move the version.
 * Port and contract: `deck-repository-port.ts`,
 * `testing/deck-repository-contract.ts`.
 *
 * @module deck/deck-repository
 */
import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type {
  DeckRepository,
  DeckWriteResult,
  DeckWriteTarget,
} from "@/lib/deck/deck-repository-port";

type Transaction = Prisma.TransactionClient;

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
        tx.deckCard.create({
          data: {
            ...card,
            colorIdentity: [...card.colorIdentity],
            deckId: target.deckId,
          },
        })
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
  };
}

/** The repository the route handlers use, on the process-wide client. */
export const deckRepository: DeckRepository = prismaDeckRepository(prisma);
