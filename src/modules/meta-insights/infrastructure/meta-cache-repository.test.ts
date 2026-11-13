// @vitest-environment node
/**
 * Runs the `MetaCacheRepository` contract against the Prisma adapter over the
 * in-memory `metaCache` table, and pins what only the adapter does: the Zod
 * parse of the stored `Json` column, which turns a row of another shape into
 * a miss, and the day it stamps on `expiresAt`.
 *
 * The client is `stubPrisma` on a never-connected `PrismaClient`, as the
 * route tests build it, so the adapter is exercised on the real client type
 * with no `vi.mock`.
 */
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { createFakeMetaCacheTable } from "@/test/meta-cache-db-fake";
import { stubPrisma } from "@/test/prisma-stub";
import {
  ATRAXA_EDHREC,
  ATRAXA_TOURNAMENT,
  describeMetaCacheRepositoryContract,
  EDHREC_ANSWER,
  OBSERVED_AT,
  type MetaCacheRepositoryHarness,
} from "@/modules/meta-insights/testing/meta-cache-repository-contract";
import {
  META_CACHE_TTL_MS,
  prismaMetaCacheRepository,
} from "./meta-cache-repository";

/** A row's dates, as the contract's observation time would have produced them. */
const ROW_DATES = {
  cachedAt: OBSERVED_AT,
  expiresAt: new Date(OBSERVED_AT.getTime() + META_CACHE_TTL_MS),
};

/** @returns the adapter over a fresh fake table, plus the table for seeding */
function prismaHarness() {
  const table = createFakeMetaCacheTable();
  const client = stubPrisma({ prisma }, { metaCache: table }).prisma;
  return { repository: prismaMetaCacheRepository(client), table };
}

/** @returns the contract's view of {@link prismaHarness} */
function contractHarness(): MetaCacheRepositoryHarness {
  const { repository, table } = prismaHarness();
  return {
    repository,
    storeGoesDown: () => table.failNext(new Error("connection lost")),
  };
}

describe("Prisma meta cache repository — MetaCacheRepository contract", () => {
  describeMetaCacheRepositoryContract(contractHarness);
});

describe("Prisma meta cache repository — the stored row", () => {
  it("writes the answer as plain JSON under the commander and source, fresh for one day", async () => {
    const { repository, table } = prismaHarness();

    await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT);

    expect([...table.rows.values()]).toEqual([
      expect.objectContaining({
        commanderSlug: ATRAXA_EDHREC.commanderSlug,
        source: "edhrec",
        data: EDHREC_ANSWER,
        ...ROW_DATES,
      }),
    ]);
  });

  it("reads a row whose data is not an EDHREC answer as a miss", async () => {
    const { repository, table } = prismaHarness();
    table.seed(ATRAXA_EDHREC.commanderSlug, "edhrec", {
      data: { cards: "not a list" },
      ...ROW_DATES,
    });

    expect(await repository.read(ATRAXA_EDHREC)).toBeNull();
  });

  it("reads a tournament row whose decks lack their link as a miss", async () => {
    const { repository, table } = prismaHarness();
    table.seed(ATRAXA_TOURNAMENT.commanderSlug, "tournament", {
      data: { decks: [{ name: "Known deck", source: "mtgtop8" }] },
      ...ROW_DATES,
    });

    expect(await repository.read(ATRAXA_TOURNAMENT)).toBeNull();
  });

  it("reads an EDHREC row stored under the tournament source as a miss", async () => {
    const { repository, table } = prismaHarness();
    table.seed(ATRAXA_TOURNAMENT.commanderSlug, "tournament", {
      data: EDHREC_ANSWER,
      ...ROW_DATES,
    });

    expect(await repository.read(ATRAXA_TOURNAMENT)).toBeNull();
  });

  it("reads a row of the expected shape with only its required fields", async () => {
    const { repository, table } = prismaHarness();
    table.seed(ATRAXA_EDHREC.commanderSlug, "edhrec", {
      data: { cards: [{ name: "Sol Ring", inclusion: 0.8 }] },
      ...ROW_DATES,
    });

    expect(await repository.read(ATRAXA_EDHREC)).toEqual({
      data: { cards: [{ name: "Sol Ring", inclusion: 0.8 }] },
      ...ROW_DATES,
    });
  });
});
