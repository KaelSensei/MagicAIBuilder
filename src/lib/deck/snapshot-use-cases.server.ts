/**
 * The snapshot use cases wired to PostgreSQL.
 *
 * Deck-building context, composition root for the server. The routes under
 * `src/app/api/decks/[id]/snapshots` import `deckSnapshots` from here and
 * nothing from the adapter, so a test of a use case needs no Prisma.
 *
 * @module deck/snapshot-use-cases.server
 */
import "server-only";
import { prisma } from "@/lib/db/prisma";
import { prismaSnapshotStore } from "@/lib/deck/prisma-snapshot-store";
import {
  makeSnapshotUseCases,
  type SnapshotUseCases,
} from "@/lib/deck/snapshot-use-cases";

/** The snapshot use cases on the shared Prisma client. */
export const deckSnapshots: SnapshotUseCases = makeSnapshotUseCases(
  prismaSnapshotStore(prisma)
);
