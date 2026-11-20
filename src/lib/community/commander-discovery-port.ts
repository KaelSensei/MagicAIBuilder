/**
 * What the commander discovery listing needs from the outside: the public
 * decks led by one commander, each with the votes and ratings it is ranked
 * by.
 *
 * Community context, commander discovery (master plan COM-10). Types only:
 * no framework or database import, so `listCommanderDecks`
 * (`commander-discovery-use-case.ts`) runs in Vitest on the fake in
 * `testing/in-memory-commander-deck-reader.ts`. The implementation over
 * PostgreSQL is `prismaCommanderDeckReader` (`prisma-commander-deck-reader.ts`),
 * wired by `commander-decks-lookup.ts`.
 *
 * @module community/commander-discovery-port
 */
import type {
  DiscoveryAuthor,
  DiscoveryCommander,
} from "@/lib/community/discovery-types";
import type { DeckVote } from "@/lib/community/votes";
import type { DeckRating } from "@/lib/ratings/ratings";

/** One public deck as the discovery listing reads it, before it is summarised. */
export interface DiscoveryDeckRecord {
  readonly id: string;
  readonly name: string;
  readonly format: string;
  /**
   * The denormalised commander name. Null on a deck saved before the
   * `commanderName` backfill, or cleared after the slug match ran.
   */
  readonly commanderName: string | null;
  readonly updatedAt: Date;
  /**
   * The deck's cards as the editor counts them: main-zone copies plus the
   * commander and the partner (`countStoredCardCopies`), so thirty Forests in
   * one row count thirty.
   */
  readonly cardCount: number;
  /**
   * The deck's `isCommander` card, or null when the deck has none: before
   * #1444 the command zone was saved in three requests, and a failure between
   * them left a `commanderName` with no commander row.
   */
  readonly commanderCard: DiscoveryCommander | null;
  /** The owner as displayed, or null for an ownerless deck. */
  readonly author: DiscoveryAuthor | null;
  /** Every vote cast on the deck; a stored value other than +1 or -1 is left out. */
  readonly votes: readonly DeckVote[];
  /** Every star rating of the deck. */
  readonly ratings: readonly DeckRating[];
}

/**
 * The public decks, looked up by commander slug.
 *
 * An implementation guarantees:
 * - `listPublicDecksByCommanderSlug` answers every public deck whose
 *   `commanderName` slugifies to `slug` (`commanderToSlug`), in no
 *   particular order, and no deck for a slug no name produces;
 * - it rejects with the store's own error when the store fails; the route
 *   turns that into a 500.
 */
export interface CommanderDeckReader {
  listPublicDecksByCommanderSlug(
    slug: string
  ): Promise<readonly DiscoveryDeckRecord[]>;
}
