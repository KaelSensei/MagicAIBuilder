// @vitest-environment node
/**
 * Runs the public fork store contract against the Prisma adapter on a real
 * PostgreSQL, so the filter, the order, the limit and the count are proven
 * where they run: in the database.
 *
 * Opt-in. It runs only when `CONTRACT_TEST_DATABASE_URL` names a throwaway
 * database with every migration applied; otherwise it is skipped, as in the
 * default `pnpm test` and in CI today. It never reads `DATABASE_URL`, which
 * may point at a shared or production database. It deletes exactly the users
 * and decks it created.
 *
 * ```sh
 * CONTRACT_TEST_DATABASE_URL=postgresql://… npx vitest run src/lib/deck/public-fork-store.prisma.test.ts
 * ```
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe } from "vitest";

import { prismaPublicForkStore } from "./public-fork-store";
import {
  describePublicForkStoreContract,
  type DeckSeed,
  type PublicForkStoreHarness,
} from "./testing/public-fork-store-contract";

const databaseUrl = process.env.CONTRACT_TEST_DATABASE_URL;

/** The ids of every row a harness created, for the clean-up. */
interface SeededRows {
  readonly decks: string[];
  readonly users: string[];
}

/** Stores the seed's author as a new user. @returns the user's id, or null */
async function seedAuthor(
  client: PrismaClient,
  seed: DeckSeed,
  seeded: SeededRows
): Promise<string | null> {
  if (seed.author === null) return null;
  const user = await client.user.create({
    data: {
      email: `${randomUUID()}@public-fork-contract.test`,
      name: seed.author.name,
      username: seed.author.username,
    },
  });
  seeded.users.push(user.id);
  return user.id;
}

/** @returns a harness on `client` that records every row it seeds in `seeded` */
function prismaHarness(
  client: PrismaClient,
  seeded: SeededRows
): PublicForkStoreHarness {
  return {
    store: prismaPublicForkStore(client),
    seedDeck: async (seed) => {
      const userId = await seedAuthor(client, seed, seeded);
      const deck = await client.deck.create({
        data: {
          name: seed.name,
          isPublic: seed.isPublic,
          forkedFromDeckId: seed.forkedFromDeckId,
          updatedAt: seed.updatedAt,
          userId,
        },
      });
      seeded.decks.push(deck.id);
      return deck.id;
    },
  };
}

describe.skipIf(databaseUrl === undefined)(
  "Prisma public fork store on PostgreSQL",
  () => {
    // Built in `beforeAll`: a skipped suite still runs this body to list its
    // cases, and must not build a client.
    let client: PrismaClient;
    const seeded: SeededRows = { decks: [], users: [] };

    beforeAll(async () => {
      client = new PrismaClient({ datasourceUrl: databaseUrl });
      await client.$connect();
    });

    afterAll(async () => {
      await client.deck.deleteMany({ where: { id: { in: seeded.decks } } });
      await client.user.deleteMany({ where: { id: { in: seeded.users } } });
      await client.$disconnect();
    });

    describePublicForkStoreContract(() => prismaHarness(client, seeded));
  }
);
