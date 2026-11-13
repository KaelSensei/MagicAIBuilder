/**
 * Runs the `MetaCacheRepository` contract against the in-memory fake, so the
 * use case tests that lean on the fake can trust it to behave like the
 * Prisma adapter, and pins what the fake adds for its tests: seeding with
 * arbitrary dates, the record of the writes, and recovery after an outage.
 */
import { describe, expect, it } from "vitest";

import {
  ATRAXA_EDHREC,
  describeMetaCacheRepositoryContract,
  EDHREC_ANSWER,
  OBSERVED_AT,
  type MetaCacheRepositoryHarness,
} from "./meta-cache-repository-contract";
import { inMemoryMetaCacheRepository } from "./in-memory-meta-cache-repository";

/** @returns a harness on a new, empty fake */
function inMemoryHarness(): MetaCacheRepositoryHarness {
  const repository = inMemoryMetaCacheRepository();
  return { repository, storeGoesDown: () => repository.goDown() };
}

describe("in-memory meta cache repository — MetaCacheRepository contract", () => {
  describeMetaCacheRepositoryContract(inMemoryHarness);

  it("reads a seeded entry back with the dates it was seeded with", async () => {
    const repository = inMemoryMetaCacheRepository();
    const entry = {
      data: EDHREC_ANSWER,
      cachedAt: new Date("2026-08-20T10:30:00.000Z"),
      expiresAt: new Date("2026-08-21T10:30:00.000Z"),
    };

    repository.seed(ATRAXA_EDHREC, entry);

    expect(await repository.read(ATRAXA_EDHREC)).toEqual(entry);
  });

  it("records a write it had to drop while down, then stores again once recovered", async () => {
    const repository = inMemoryMetaCacheRepository();
    repository.goDown();

    await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT);
    repository.recover();

    expect(repository.writes).toEqual([ATRAXA_EDHREC]);
    expect(await repository.read(ATRAXA_EDHREC)).toBeNull();
    await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT);
    expect((await repository.read(ATRAXA_EDHREC))?.data).toEqual(EDHREC_ANSWER);
  });

  it("gives each instance its own rows, so no test sees another's seed", async () => {
    await inMemoryMetaCacheRepository().write(
      ATRAXA_EDHREC,
      EDHREC_ANSWER,
      OBSERVED_AT
    );

    expect(await inMemoryMetaCacheRepository().read(ATRAXA_EDHREC)).toBeNull();
  });
});
