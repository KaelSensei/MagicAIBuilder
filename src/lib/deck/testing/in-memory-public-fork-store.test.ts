/**
 * Runs the public fork store contract against the in-memory fake, so the
 * tests that use the fake can trust it to answer like PostgreSQL.
 */
import { describe } from "vitest";

import { inMemoryPublicForkStore } from "./in-memory-public-fork-store";
import {
  describePublicForkStoreContract,
  type PublicForkStoreHarness,
} from "./public-fork-store-contract";

/** @returns a harness on a new, empty fake */
function inMemoryHarness(): PublicForkStoreHarness {
  const fake = inMemoryPublicForkStore();
  return { store: fake, seedDeck: fake.seedDeck };
}

describe("in-memory public fork store", () => {
  describePublicForkStoreContract(inMemoryHarness);
});
