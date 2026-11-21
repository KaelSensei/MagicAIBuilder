/**
 * Pins the read behind the "Inspiration for" line of a public deck page
 * (I-08, AC-08-193 and AC-08-194): it names at most ten forks with the true
 * count, and a failed read yields no forks instead of failing the page. The
 * store's own rules (public, direct, newest first) are pinned by its contract
 * suite, `testing/public-fork-store-contract.ts`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { forEachSequential } from "@/lib/async/sequential";
import { logger } from "@/lib/logger";
import {
  INSPIRED_FORKS_SHOWN,
  NO_INSPIRED_FORKS,
  readInspiredForks,
  type PublicForkStore,
} from "./inspired-forks";
import { inMemoryPublicForkStore } from "./testing/in-memory-public-fork-store";
import { aDeckSeed } from "./testing/public-fork-store-contract";

/** A store whose database is down. */
const UNREADABLE_STORE: PublicForkStore = {
  publicForksOf: () => Promise.reject(new Error("connection refused")),
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readInspiredForks", () => {
  it("names the ten most recently updated public forks and counts all twelve", async () => {
    const store = inMemoryPublicForkStore();
    const sourceId = await store.seedDeck(aDeckSeed({ name: "The original" }));
    const days = Array.from({ length: 12 }, (_, index) => index + 1);
    await forEachSequential(days, async (day) => {
      await store.seedDeck(
        aDeckSeed({
          name: `Fork ${day}`,
          forkedFromDeckId: sourceId,
          updatedAt: new Date(Date.UTC(2026, 10, day)),
        })
      );
    });

    const inspired = await readInspiredForks(store, sourceId);

    expect(INSPIRED_FORKS_SHOWN).toBe(10);
    expect(inspired.total).toBe(12);
    expect(inspired.forks.map((fork) => fork.name)).toEqual([
      "Fork 12",
      "Fork 11",
      "Fork 10",
      "Fork 9",
      "Fork 8",
      "Fork 7",
      "Fork 6",
      "Fork 5",
      "Fork 4",
      "Fork 3",
    ]);
  });

  it("yields no forks, and does not reject, when the store cannot be read, and logs the failure", async () => {
    const logged = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    const inspired = await readInspiredForks(UNREADABLE_STORE, "deck-1");

    expect(inspired).toEqual(NO_INSPIRED_FORKS);
    expect(logged).toHaveBeenCalledWith(
      "Could not read the public forks of a deck",
      "readInspiredForks",
      expect.any(Error)
    );
  });
});
