/**
 * The shared contract suite of the public fork store port (ADR 0005: one
 * suite per owned port, run against the in-memory fake and the real adapter).
 *
 * It pins what every `PublicForkStore` must answer for "which public decks
 * were forked from this one": only public forks, only direct ones, the most
 * recently updated first, at most `limit` of them with the true count, and
 * each with its author's public name. Callers:
 * `in-memory-public-fork-store.test.ts` and `public-fork-store.prisma.test.ts`.
 *
 * @module deck/testing/public-fork-store-contract
 */
import { describe, expect, it } from "vitest";

import type { PublicForkStore } from "@/lib/deck/inspired-forks";

/** The author of a seeded deck: the two columns a byline may show. */
export interface SeedAuthor {
  readonly name: string | null;
  readonly username: string | null;
}

/** A deck the harness stores for one case. */
export interface DeckSeed {
  readonly name: string;
  readonly isPublic: boolean;
  /** The deck this one was forked from, or null for an original deck. */
  readonly forkedFromDeckId: string | null;
  readonly updatedAt: Date;
  /** The owner, or null for a deck without one. */
  readonly author: SeedAuthor | null;
}

/** One adapter under test, with the seeding the suite needs. */
export interface PublicForkStoreHarness {
  readonly store: PublicForkStore;
  /** Stores `seed` as a new deck. @returns the new deck's id */
  readonly seedDeck: (seed: DeckSeed) => Promise<string>;
}

/**
 * A public original deck by "Kael", last updated on 2026-11-01. The author has
 * no username by default: usernames are unique, so a case that needs one
 * names it once.
 */
export function aDeckSeed(overrides: Partial<DeckSeed> = {}): DeckSeed {
  return {
    name: "Atraxa Superfriends",
    isPublic: true,
    forkedFromDeckId: null,
    updatedAt: new Date("2026-11-01T10:00:00.000Z"),
    author: { name: "Kael", username: null },
    ...overrides,
  };
}

/** The `updatedAt` of a seed `days` days after 2026-11-01. */
function dayOf(days: number): Date {
  return new Date(Date.UTC(2026, 10, 1 + days, 10));
}

/** Seeds an original public deck. @returns its id */
async function seedSource(harness: PublicForkStoreHarness): Promise<string> {
  return harness.seedDeck(aDeckSeed({ name: "The original" }));
}

/**
 * Declares the contract cases.
 *
 * @param makeHarness - builds the adapter under test; called once per case,
 *   so a case never sees another case's rows through the fake. The real
 *   database keeps every row, so each case filters by a source it seeded.
 */
export function describePublicForkStoreContract(
  makeHarness: () => PublicForkStoreHarness
): void {
  describe("PublicForkStore contract", () => {
    it("lists a deck's public forks, most recently updated first, and leaves out a private fork", async () => {
      const harness = makeHarness();
      const sourceId = await seedSource(harness);
      const fork = (name: string, isPublic: boolean, day: number) =>
        harness.seedDeck(
          aDeckSeed({
            name,
            isPublic,
            forkedFromDeckId: sourceId,
            updatedAt: dayOf(day),
          })
        );
      const olderId = await fork("Older fork", true, 1);
      await fork("Private fork", false, 3);
      const newerId = await fork("Newer fork", true, 2);

      const forks = await harness.store.publicForksOf(sourceId, 10);

      expect(forks).toEqual({
        forks: [
          { id: newerId, name: "Newer fork", author: "Kael" },
          { id: olderId, name: "Older fork", author: "Kael" },
        ],
        total: 2,
      });
    });

    it("leaves out a fork of a fork: it is listed on its own source only", async () => {
      const harness = makeHarness();
      const sourceId = await seedSource(harness);
      const forkId = await harness.seedDeck(
        aDeckSeed({ name: "First fork", forkedFromDeckId: sourceId })
      );
      const grandchildId = await harness.seedDeck(
        aDeckSeed({ name: "Fork of the fork", forkedFromDeckId: forkId })
      );

      const onSource = await harness.store.publicForksOf(sourceId, 10);
      const onFork = await harness.store.publicForksOf(forkId, 10);

      expect(onSource.forks.map((listed) => listed.id)).toEqual([forkId]);
      expect(onFork.forks.map((listed) => listed.id)).toEqual([grandchildId]);
    });

    it("returns at most `limit` forks, the most recent, and still counts every public fork", async () => {
      const harness = makeHarness();
      const sourceId = await seedSource(harness);
      const forkIds = await Promise.all(
        [1, 2, 3, 4].map((day) =>
          harness.seedDeck(
            aDeckSeed({
              name: `Fork ${day}`,
              forkedFromDeckId: sourceId,
              updatedAt: dayOf(day),
            })
          )
        )
      );

      const forks = await harness.store.publicForksOf(sourceId, 3);

      expect(forks.total).toBe(4);
      expect(forks.forks.map((listed) => listed.id)).toEqual(
        forkIds.slice(1).reverse()
      );
    });

    it("names each fork's author by name, then username, and nobody for a deck without an owner", async () => {
      const harness = makeHarness();
      const sourceId = await seedSource(harness);
      const seedFork = (author: SeedAuthor | null, day: number) =>
        harness.seedDeck(
          aDeckSeed({
            forkedFromDeckId: sourceId,
            updatedAt: dayOf(day),
            author,
          })
        );
      await seedFork({ name: "Ana", username: null }, 3);
      await seedFork({ name: null, username: "bo-public-fork-contract" }, 2);
      await seedFork(null, 1);

      const forks = await harness.store.publicForksOf(sourceId, 10);

      expect(forks.forks.map((listed) => listed.author)).toEqual([
        "Ana",
        "bo-public-fork-contract",
        null,
      ]);
    });

    it("lists nothing and counts zero for a deck nobody forked", async () => {
      const harness = makeHarness();
      const sourceId = await seedSource(harness);

      const forks = await harness.store.publicForksOf(sourceId, 10);

      expect(forks).toEqual({ forks: [], total: 0 });
    });
  });
}
