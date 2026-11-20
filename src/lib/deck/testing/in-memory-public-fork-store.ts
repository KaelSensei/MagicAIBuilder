/**
 * An in-memory `PublicForkStore` for tests (ADR 0005: owned ports get a
 * hand-written fake that passes the port's contract suite).
 *
 * It keeps seeded decks in a list and answers with the filter, order and
 * limit the Prisma adapter asks PostgreSQL for. Contract:
 * `public-fork-store-contract.ts`.
 *
 * @module deck/testing/in-memory-public-fork-store
 */
import type {
  InspiredFork,
  InspiredForks,
  PublicForkStore,
} from "@/lib/deck/inspired-forks";
import { compareCodeUnits } from "@/lib/text/code-unit-order";

import type { DeckSeed } from "./public-fork-store-contract";

/** The fake, plus the seeding its tests use. */
export interface InMemoryPublicForkStore extends PublicForkStore {
  /** Stores `seed` as a new deck. @returns its id, unique within this fake */
  readonly seedDeck: (seed: DeckSeed) => Promise<string>;
}

/** A seeded deck with the id the fake gave it. */
type StoredDeck = DeckSeed & { readonly id: string };

/** Most recently updated first, then by id, as the adapter's `orderBy` asks. */
function newestFirst(left: StoredDeck, right: StoredDeck): number {
  const byUpdate = right.updatedAt.getTime() - left.updatedAt.getTime();
  return byUpdate === 0 ? compareCodeUnits(left.id, right.id) : byUpdate;
}

/** The listed shape: id, name and the author's public name or username. */
function listed(deck: StoredDeck): InspiredFork {
  return {
    id: deck.id,
    name: deck.name,
    author: deck.author?.name ?? deck.author?.username ?? null,
  };
}

/** @returns a new, empty fake */
export function inMemoryPublicForkStore(): InMemoryPublicForkStore {
  const decks: StoredDeck[] = [];

  return {
    seedDeck: (seed) => {
      const id = `deck-${decks.length + 1}`;
      decks.push({ ...seed, id });
      return Promise.resolve(id);
    },
    publicForksOf: (sourceDeckId, limit) => {
      const forks = decks
        .filter(
          (deck) => deck.isPublic && deck.forkedFromDeckId === sourceDeckId
        )
        .sort(newestFirst);
      const answer: InspiredForks = {
        forks: forks.slice(0, limit).map(listed),
        total: forks.length,
      };
      return Promise.resolve(answer);
    },
  };
}
