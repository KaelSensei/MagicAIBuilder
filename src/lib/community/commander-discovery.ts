/**
 * The commander discovery listing as pure rules: how one public deck becomes
 * a discovery row, and how the rows become the ranked, capped listing that
 * `GET /api/community/commanders/[slug]/decks` and the commander decks page
 * show.
 *
 * Community context, domain (master plan COM-10). No framework or database
 * import. The arithmetic comes from `calculateVoteScore` and
 * `rankDecksByScore` (`votes.ts`) and from `calculateAverageRating` and
 * `getDeckQualityBadge` (`ratings/ratings.ts`); `listCommanderDecks`
 * (`commander-discovery-use-case.ts`) feeds these functions what the reader
 * port answers.
 *
 * @module community/commander-discovery
 */
import type { DiscoveryDeckRecord } from "@/lib/community/commander-discovery-port";
import type {
  CommanderDeckSummary,
  CommanderDecksResponse,
  DiscoveryCommander,
} from "@/lib/community/discovery-types";
import { calculateVoteScore, rankDecksByScore } from "@/lib/community/votes";
import {
  calculateAverageRating,
  getDeckQualityBadge,
} from "@/lib/ratings/ratings";

/**
 * Hard cap on a single listing; discovery is a browse surface, not an
 * export. The reader still loads every matching deck, because ranking needs
 * every deck's votes and ratings before it can tell which 50 come first.
 */
export const COMMANDER_DECKS_LIMIT = 50;

/** A discovery row before it leaves the server: `updatedAt` stays a date, which ranking compares. */
export type RankableDiscoveryDeck = Omit<CommanderDeckSummary, "updatedAt"> & {
  readonly updatedAt: Date;
};

/**
 * The commander as the row shows it: the deck's commander card when it has
 * one, otherwise a commander named after the denormalised `commanderName`
 * with no image, which the row renders as the card back. Such a deck is
 * listed rather than dropped or left to break the page (#1460).
 *
 * The reader's slug match requires a non-null `commanderName`, so the empty
 * name only covers a deck whose name was cleared between the match and the
 * read of its rows.
 */
function discoveryCommanderOf(deck: DiscoveryDeckRecord): DiscoveryCommander {
  return (
    deck.commanderCard ?? {
      name: deck.commanderName ?? "",
      imageUri: "",
      artCropUri: "",
    }
  );
}

/**
 * Summarises one public deck as its discovery row.
 *
 * @param deck - the deck as the reader answered it
 * @param viewerId - the signed-in viewer, or null when signed out; picks the
 *   viewer's own vote out of the tally, null when they have not voted
 * @returns the row, its `updatedAt` still a date for {@link rankDecksByScore}
 */
export function summariseDiscoveryDeck(
  deck: DiscoveryDeckRecord,
  viewerId: string | null
): RankableDiscoveryDeck {
  const tally = calculateVoteScore(deck.votes);

  return {
    viewerVote:
      deck.votes.find((vote) => vote.userId === viewerId)?.value ?? null,
    id: deck.id,
    name: deck.name,
    format: deck.format,
    updatedAt: deck.updatedAt,
    cardCount: deck.cardCount,
    commander: discoveryCommanderOf(deck),
    author: deck.author,
    score: tally.score,
    upvotes: tally.upvotes,
    downvotes: tally.downvotes,
    averageRating: calculateAverageRating(deck.ratings),
    ratingCount: deck.ratings.length,
    badge: getDeckQualityBadge(deck.ratings),
  };
}

/** Dates become ISO strings, so the cached read, the fresh read and the route agree. */
function toSummary(deck: RankableDiscoveryDeck): CommanderDeckSummary {
  return { ...deck, updatedAt: deck.updatedAt.toISOString() };
}

/**
 * Builds the listing of the commander behind `slug` from its public decks:
 * summarised, ranked by {@link rankDecksByScore}, capped at
 * {@link COMMANDER_DECKS_LIMIT}, dates as ISO strings.
 *
 * @param slug - the commander slug, echoed in the listing
 * @param decks - every public deck the slug matched, in any order
 * @param viewerId - the signed-in viewer, or null when signed out
 * @returns the listing; `total` counts every deck, `decks` at most the cap.
 *   `commanderName` is the first deck's denormalised name, falling back to
 *   its commander card for a deck saved before the `commanderName` backfill,
 *   and null for a commander nobody has published
 */
export function buildCommanderDeckListing(
  slug: string,
  decks: readonly DiscoveryDeckRecord[],
  viewerId: string | null
): CommanderDecksResponse {
  const first = decks.at(0);
  const ranked = rankDecksByScore(
    decks.map((deck) => summariseDiscoveryDeck(deck, viewerId))
  ).slice(0, COMMANDER_DECKS_LIMIT);

  return {
    slug,
    commanderName: first?.commanderName ?? first?.commanderCard?.name ?? null,
    total: decks.length,
    decks: ranked.map(toSummary),
  };
}
