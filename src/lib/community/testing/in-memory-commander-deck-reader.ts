/**
 * In-memory fake of the `CommanderDeckReader` port, for the commander
 * discovery tests (ADR 0005: owned ports get a hand-written fake).
 *
 * Community context, commander discovery. The fake holds the public decks of
 * each commander slug and answers them in the order they were seeded, as the
 * real adapter answers its rows in no guaranteed order: the listing must not
 * depend on the order a reader returns. It records the slugs it was asked
 * for, so a test can check the use case passes the slug through untouched.
 *
 * @module community/testing/in-memory-commander-deck-reader
 */
import type {
  CommanderDeckReader,
  DiscoveryDeckRecord,
} from "@/lib/community/commander-discovery-port";

/** The reader fake, with the slugs it was asked for exposed for assertions. */
export interface InMemoryCommanderDeckReader extends CommanderDeckReader {
  readonly requestedSlugs: string[];
}

/**
 * @param decksBySlug - the public decks led by each commander, keyed by slug;
 *   any other slug reads as no deck
 * @returns a new reader, independent of every other
 */
export function inMemoryCommanderDeckReader(
  decksBySlug: Readonly<Record<string, readonly DiscoveryDeckRecord[]>> = {}
): InMemoryCommanderDeckReader {
  const requestedSlugs: string[] = [];
  return {
    requestedSlugs,
    listPublicDecksByCommanderSlug: (slug) => {
      requestedSlugs.push(slug);
      return Promise.resolve(decksBySlug[slug] ?? []);
    },
  };
}
