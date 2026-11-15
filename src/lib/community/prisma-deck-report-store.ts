/**
 * The `DeckReportStore` port over the `DeckReport` table.
 *
 * Community context, deck actions. Implements `deck-action-ports.ts` for
 * `deck-report-use-cases.ts`; wired by `deck-action-server.ts`. One report
 * per reporter and deck is the table's unique key (`userId_deckId`). Each
 * method is one statement, as the port requires: `createMany` with
 * `skipDuplicates` inserts or does nothing without a race against the unique
 * key, and `updateMany` filtered on `status: "pending"` cannot reopen a report
 * a moderator closed a moment earlier.
 *
 * @module community/prisma-deck-report-store
 */
import "server-only";
import type { PrismaClient } from "@prisma/client";

import type { DeckReportStore } from "@/lib/community/deck-action-ports";

/**
 * The report store over `client`.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaDeckReportStore(client: PrismaClient): DeckReportStore {
  return {
    async fileUnlessReported({ reporterId, deckId, reason }) {
      const created = await client.deckReport.createMany({
        data: [{ userId: reporterId, deckId, reason }],
        skipDuplicates: true,
      });
      return created.count > 0;
    },

    async replacePendingReason({ reporterId, deckId, reason }) {
      const replaced = await client.deckReport.updateMany({
        where: { userId: reporterId, deckId, status: "pending" },
        data: { reason },
      });
      return replaced.count > 0;
    },
  };
}
