// @vitest-environment node
/**
 * Runs the deck repository contract against the Prisma adapter on a real
 * PostgreSQL, so the compare-and-swap and the rollback are proven where they
 * actually happen: in the database.
 *
 * Opt-in. It runs only when `CONTRACT_TEST_DATABASE_URL` names a throwaway
 * database with every migration applied; otherwise it is skipped, as in the
 * default `pnpm test` and in CI today. It never reads `DATABASE_URL`, which
 * may point at a shared or production database. It writes decks without an
 * owner and deletes exactly the decks it created (their cards go by cascade).
 *
 * ```sh
 * CONTRACT_TEST_DATABASE_URL=postgresql://… npx prisma migrate deploy
 * CONTRACT_TEST_DATABASE_URL=postgresql://… npx vitest run src/lib/deck/deck-repository.prisma.test.ts
 * ```
 *
 * (`prisma migrate deploy` reads `DATABASE_URL`; set it to the same throwaway
 * URL for that one command.)
 */
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe } from "vitest";

import { forEachSequential } from "@/lib/async/sequential";
import { prismaDeckRepository } from "./deck-repository";
import {
  describeDeckRepositoryContract,
  SEEDED_AT,
  type DeckRepositoryHarness,
} from "./testing/deck-repository-contract";

const databaseUrl = process.env.CONTRACT_TEST_DATABASE_URL;

/** @returns a harness on `client` that records every deck it seeds in `seeded` */
function prismaHarness(
  client: PrismaClient,
  seeded: string[]
): DeckRepositoryHarness {
  return {
    repository: prismaDeckRepository(client),
    seedDeck: async (cards) => {
      const deck = await client.deck.create({
        data: { name: "Contract deck", updatedAt: SEEDED_AT },
      });
      seeded.push(deck.id);
      // One by one, so `cardIds` follows the order of `cards`.
      const cardIds: string[] = [];
      await forEachSequential(cards, async (card) => {
        const row = await client.deckCard.create({
          data: {
            ...card,
            colorIdentity: [...card.colorIdentity],
            deckId: deck.id,
          },
        });
        cardIds.push(row.id);
      });
      return { deckId: deck.id, version: deck.version, cardIds };
    },
    storedDeck: async (deckId) => {
      const deck = await client.deck.findUnique({
        where: { id: deckId },
        include: { cards: true },
      });
      return deck ?? undefined;
    },
  };
}

/** Overlapping queries the warm-up runs; more than the concurrent writers. */
const WARM_CONNECTIONS = 8;

/**
 * Opens several pooled connections before the cases run.
 *
 * Prisma opens a connection only when a query needs one. Without this, the
 * first of the concurrent writers gets the one warm connection and commits
 * while the others are still connecting, so they never race and a check made
 * outside the database would pass. Queries that overlap in time (each sleeps
 * 50 ms) each need their own connection.
 */
async function openPooledConnections(client: PrismaClient): Promise<void> {
  await Promise.all(
    Array.from(
      { length: WARM_CONNECTIONS },
      () => client.$executeRaw`SELECT pg_sleep(0.05)`
    )
  );
}

describe.skipIf(databaseUrl === undefined)(
  "Prisma deck repository on PostgreSQL — DeckRepository contract",
  () => {
    // Built in `beforeAll`: a skipped suite still runs this body to list its
    // cases, and must not build a client.
    let client: PrismaClient;
    const seeded: string[] = [];

    beforeAll(async () => {
      client = new PrismaClient({ datasourceUrl: databaseUrl });
      await client.$connect();
      await openPooledConnections(client);
    });

    afterAll(async () => {
      await client.deck.deleteMany({ where: { id: { in: seeded } } });
      await client.$disconnect();
    });

    describeDeckRepositoryContract(() => prismaHarness(client, seeded));
  }
);
