/**
 * The public decks a deck inspired: the public decks forked from it, which
 * its public page lists beside its "Forked from" credit (I-08, US-08-132).
 *
 * Community context. A fork records its source when it is made
 * (`forkedFromDeckId`, written by `buildForkData` in `lib/deck/fork.ts`); this
 * module reads that link forward. Only public forks count, and only direct
 * ones: a fork of a fork is listed on its own source. NetrunnerDB shows the
 * same pair, "Derived from" and "Inspiration for", on its decklists
 * (https://netrunnerdb.com/en/decklist/6092a490-4d1a-4f83-b9eb-440e7d07c657,
 * seen 2026-11-10).
 *
 * Holds the port, its types and the read; no framework or database import,
 * so client components may import the types. The PostgreSQL adapter is
 * `prismaPublicForkStore` in `lib/deck/public-fork-store.ts`; the fake is
 * `inMemoryPublicForkStore` in `lib/deck/testing/`. Both pass the contract in
 * `lib/deck/testing/public-fork-store-contract.ts`.
 *
 * @module deck/inspired-forks
 */
import { logger } from "@/lib/logger";

/** A public fork as its source's page lists it: public columns only. */
export interface InspiredFork {
  readonly id: string;
  readonly name: string;
  /** The fork's author by public name, then username; null when unknown. */
  readonly author: string | null;
}

/** The public forks of one deck: the most recent few, and how many there are. */
export interface InspiredForks {
  /** The most recently updated public forks, newest first. */
  readonly forks: readonly InspiredFork[];
  /** Every public direct fork, listed or not. */
  readonly total: number;
}

/** What a deck nobody forked publicly shows: no fork, no line. */
export const NO_INSPIRED_FORKS: InspiredForks = { forks: [], total: 0 };

/**
 * How many forks the deck page names before it says "and N more". Ten keeps
 * the action bar to a line or two on a phone while a popular deck is forked
 * far more often.
 */
export const INSPIRED_FORKS_SHOWN = 10;

/** The port: where the public forks of a deck are read from. */
export interface PublicForkStore {
  /**
   * Reads the public decks forked directly from `sourceDeckId`.
   *
   * @param sourceDeckId - the deck whose forks are wanted; an unknown id has none
   * @param limit - the most forks to return, a positive integer
   * @returns at most `limit` forks, the most recently updated first (ties by
   *   id), and the count of every public direct fork
   * @throws when the store cannot be read
   */
  publicForksOf(sourceDeckId: string, limit: number): Promise<InspiredForks>;
}

/**
 * Reads the forks the deck page lists for `sourceDeckId`.
 *
 * Never rejects: the list is a side note of the page, so a failed read is
 * logged and yields {@link NO_INSPIRED_FORKS}, and the deck still renders
 * without the line (AC-08-194).
 *
 * @param store - the store to read
 * @param sourceDeckId - the deck the page shows
 * @returns the {@link INSPIRED_FORKS_SHOWN} most recent public forks and
 *   their true count, or none when the read fails
 */
export async function readInspiredForks(
  store: PublicForkStore,
  sourceDeckId: string
): Promise<InspiredForks> {
  try {
    return await store.publicForksOf(sourceDeckId, INSPIRED_FORKS_SHOWN);
  } catch (error) {
    logger.error(
      "Could not read the public forks of a deck",
      "readInspiredForks",
      error
    );
    return NO_INSPIRED_FORKS;
  }
}
