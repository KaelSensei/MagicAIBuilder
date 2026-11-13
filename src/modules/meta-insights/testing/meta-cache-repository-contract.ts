/**
 * The shared contract suite of the `MetaCacheRepository` port (ADR 0005: one
 * suite per owned port, run against the in-memory fake and the Prisma
 * adapter).
 *
 * It pins what every `MetaCacheRepository` must do for `getCommanderMeta`: a
 * key nobody wrote reads as null; a written answer reads back with
 * `cachedAt` = the observation time and `expiresAt` one day later; the entry
 * is read back whatever its age, because the stale fallback needs it; a
 * second write replaces the first; the two sources of one commander are two
 * entries; and a store that is down answers a miss and drops the write
 * instead of throwing (B2-12 keeps that silence until it decides otherwise).
 * Callers: `in-memory-meta-cache-repository.test.ts` and
 * `infrastructure/meta-cache-repository.test.ts`.
 *
 * What it leaves to the adapter's own tests: the Zod parse of a stored row,
 * which the fake has no equivalent of, since it stores typed entries.
 *
 * @module meta-insights/testing/meta-cache-repository-contract
 */
import { describe, expect, it } from "vitest";

import type {
  MetaCacheKey,
  MetaCacheRepository,
} from "@/modules/meta-insights/application/ports";
import type {
  EdhrecData,
  TournamentData,
} from "@/modules/meta-insights/domain/types";

/** One repository under test, with the switch that takes its store down. */
export interface MetaCacheRepositoryHarness {
  readonly repository: MetaCacheRepository;
  /** From now on every store call fails as the database would: the repository must hide it. */
  readonly storeGoesDown: () => void;
}

/** The time to live every implementation stamps: one day, EDHREC's own refresh cadence. */
export const CONTRACT_TTL_MS = 24 * 60 * 60 * 1000;

/** The commander every contract case stores, under its EDHREC source. */
export const ATRAXA_EDHREC: MetaCacheKey = {
  commanderSlug: "atraxa-praetors-voice",
  source: "edhrec",
};

/** The same commander under its tournament source: another entry. */
export const ATRAXA_TOURNAMENT: MetaCacheKey = {
  commanderSlug: "atraxa-praetors-voice",
  source: "tournament",
};

/** An EDHREC answer with every optional field set, so a round trip is checked whole. */
export const EDHREC_ANSWER: EdhrecData = {
  cards: [
    {
      name: "Sol Ring",
      inclusion: 0.92,
      sample: { decksWithCard: 920, eligibleDecks: 1000 },
    },
    { name: "Arcane Signet", inclusion: 0.81 },
  ],
};

/** A tournament answer with every optional field set. */
export const TOURNAMENT_ANSWER: TournamentData = {
  decks: [
    {
      name: "Atraxa Superfriends",
      player: "A. Pilot",
      event: "Duel Commander Open",
      date: "2026-08-20",
      placement: "1",
      format: "Duel Commander",
      eventLevel: 3,
      url: "https://www.mtgtop8.com/event?e=1&d=1&f=EDH",
      source: "mtgtop8",
    },
  ],
};

/** When the contract's live answers were observed. */
export const OBSERVED_AT = new Date("2026-08-30T01:00:00.000Z");

/**
 * Registers the contract cases against `makeHarness`, which is called once
 * per case so that no case sees another's rows.
 */
export function describeMetaCacheRepositoryContract(
  makeHarness: () => MetaCacheRepositoryHarness
): void {
  describe("MetaCacheRepository contract", () => {
    it("reads null for a commander and source nobody wrote", async () => {
      const { repository } = makeHarness();

      expect(await repository.read(ATRAXA_EDHREC)).toBeNull();
    });

    it("reads a written answer back, observed when it was written and fresh for one day", async () => {
      const { repository } = makeHarness();

      await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT);

      expect(await repository.read(ATRAXA_EDHREC)).toEqual({
        data: EDHREC_ANSWER,
        cachedAt: OBSERVED_AT,
        expiresAt: new Date(OBSERVED_AT.getTime() + CONTRACT_TTL_MS),
      });
    });

    it("reads a tournament answer back whole, optional fields included", async () => {
      const { repository } = makeHarness();

      await repository.write(ATRAXA_TOURNAMENT, TOURNAMENT_ANSWER, OBSERVED_AT);

      expect((await repository.read(ATRAXA_TOURNAMENT))?.data).toEqual(
        TOURNAMENT_ANSWER
      );
    });

    it("still reads an answer whose day has passed: freshness is the use case's call", async () => {
      const { repository } = makeHarness();
      const longAgo = new Date("2026-01-01T00:00:00.000Z");

      await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, longAgo);

      expect((await repository.read(ATRAXA_EDHREC))?.cachedAt).toEqual(longAgo);
    });

    it("replaces the answer when the same commander and source are written again", async () => {
      const { repository } = makeHarness();
      const later = new Date("2026-08-31T01:00:00.000Z");
      const newer: EdhrecData = {
        cards: [{ name: "Mana Crypt", inclusion: 0.5 }],
      };

      await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT);
      await repository.write(ATRAXA_EDHREC, newer, later);

      expect(await repository.read(ATRAXA_EDHREC)).toEqual({
        data: newer,
        cachedAt: later,
        expiresAt: new Date(later.getTime() + CONTRACT_TTL_MS),
      });
    });

    it("keeps the two sources of one commander apart", async () => {
      const { repository } = makeHarness();

      await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT);

      expect(await repository.read(ATRAXA_TOURNAMENT)).toBeNull();
    });

    it("answers a miss, not an error, when the store cannot be read (pinned; see B2-12)", async () => {
      const { repository, storeGoesDown } = makeHarness();
      await repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT);
      storeGoesDown();

      await expect(repository.read(ATRAXA_EDHREC)).resolves.toBeNull();
    });

    it("drops a write it cannot store, without an error (pinned; see B2-12)", async () => {
      const { repository, storeGoesDown } = makeHarness();
      storeGoesDown();

      await expect(
        repository.write(ATRAXA_EDHREC, EDHREC_ANSWER, OBSERVED_AT)
      ).resolves.toBeUndefined();
    });
  });
}
