/**
 * Runs the public fork store contract against the in-memory fake, so the
 * tests that use the fake can trust it to answer like PostgreSQL.
 */
import { describe, expect, it } from "vitest";

import { inMemoryPublicForkStore } from "./in-memory-public-fork-store";
import {
  PUBLIC_FORK_STORE_CONTRACT_CASES,
  type PublicForkStoreHarness,
} from "./public-fork-store-contract";

/** @returns a harness on a new, empty fake */
function inMemoryHarness(): PublicForkStoreHarness {
  const fake = inMemoryPublicForkStore();
  return { store: fake, seedDeck: fake.seedDeck };
}

describe("in-memory public fork store", () => {
  describe("PublicForkStore contract", () => {
    for (const contractCase of PUBLIC_FORK_STORE_CONTRACT_CASES) {
      it(contractCase.name, async () => {
        await expect(contractCase.run(inMemoryHarness())).resolves.toBeUndefined();
      });
    }
  });
});
