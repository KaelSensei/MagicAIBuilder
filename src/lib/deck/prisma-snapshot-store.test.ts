// @vitest-environment node
/**
 * Runs the snapshot port contracts against the Prisma adapters over the
 * in-memory playtest tables (`src/test/playtest-db-fake.ts`).
 *
 * The client is `stubPrisma` on a never-connected `PrismaClient`, as the
 * route tests build it, so the adapters run on the real client type with no
 * `vi.mock`. The routes' suites pin the exact Prisma arguments.
 */
import { describe } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  prismaDeckVersionStore,
  prismaSnapshotStore,
} from "@/lib/deck/prisma-snapshot-store";
import {
  describeDeckVersionStoreContract,
  describeSnapshotStoreContract,
  type SnapshotStoreHarness,
} from "@/lib/deck/testing/snapshot-store-contract";
import {
  FAKE_DECK,
  playtestDb,
  type FakeDeckCard,
} from "@/test/playtest-db-fake";
import { stubPrisma } from "@/test/prisma-stub";

/** @returns both adapters over fresh tables whose deck holds `cards` */
function harness(cards: readonly FakeDeckCard[]): SnapshotStoreHarness {
  playtestDb.reset(cards);
  const client = stubPrisma({ prisma }, playtestDb.prisma).prisma;
  return {
    deckId: FAKE_DECK.id,
    snapshots: prismaSnapshotStore(client),
    versions: prismaDeckVersionStore(client),
  };
}

describe("Prisma snapshot store", () => {
  describeSnapshotStoreContract(harness);
  describeDeckVersionStoreContract(harness);
});
