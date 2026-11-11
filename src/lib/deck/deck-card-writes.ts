/**
 * Writes to a deck's card rows, committed together with the deck's `updatedAt`.
 *
 * Why: a card lives in `DeckCard`, so Prisma's `@updatedAt` on `Deck` does not
 * move when a card changes; the card routes move it by hand. `updatedAt`
 * orders the deck lists (`GET /api/decks`, `GET /api/v1/decks`) and dates the
 * deck in the sitemap. The card write and the deck update used to run as two
 * separate statements, so a failed deck update left the card change stored
 * under the old timestamp while the client was told the save failed (B2-09).
 * One interactive transaction makes the pair all or nothing.
 *
 * Callers: the single-card handlers of `/api/decks/[id]/cards` and
 * `/api/decks/[id]/cards/[cardId]`. The bulk edit (`PATCH /api/decks/[id]/cards`)
 * keeps its own transaction, because its deck update also writes the command zone.
 *
 * @module deck/deck-card-writes
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Runs a card write, then marks the deck as edited, in one transaction.
 *
 * @param deckId - The deck whose cards `write` changes. The caller has
 *   already checked that the signed-in user owns it.
 * @param write - The card write. It must use `tx`: a write through the
 *   global client is outside the transaction and is never rolled back.
 * @returns What `write` resolved to, once both writes are committed.
 * @throws Whatever `write` or the deck update throws, for example Prisma's
 *   P2025 when the deck was deleted in the meantime. Nothing is stored then.
 */
export function writeDeckCards<Result>(
  deckId: string,
  write: (tx: Prisma.TransactionClient) => Promise<Result>
): Promise<Result> {
  return prisma.$transaction(async (tx) => {
    const result = await write(tx);
    await tx.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });
    return result;
  });
}
