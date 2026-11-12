/**
 * Reads the public decks led by one commander, ranked by community votes.
 *
 * The slug is matched in SQL against the denormalised `Deck.commanderName`;
 * the matching decks are hydrated with their votes and ratings, summarised,
 * ranked and capped at {@link MAX_DECKS}. `viewerVote` is the one
 * viewer-relative field, so a signed-in viewer's read is never cached, while a
 * signed-out visitor's read may be served from Next's data cache for
 * {@link ANONYMOUS_READ_REVALIDATE_SECONDS}.
 *
 * Shared by `GET /api/community/commanders/[slug]/decks` and the commander
 * decks page (`/commanders/[slug]/decks`), so the page reads the database
 * in-process instead of calling the app's own API over HTTP: no base URL to
 * guess, no self-call that a deployment-protected preview would refuse.
 *
 * @module community/commander-decks-lookup
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { ANONYMOUS_READ_REVALIDATE_SECONDS } from "@/lib/community/anonymous-read-cache";
import type {
  CommanderDeckSummary,
  CommanderDecksResponse,
  DiscoveryCommander,
} from "@/lib/community/discovery-types";
import {
  calculateVoteScore,
  isValidVoteValue,
  rankDecksByScore,
  type DeckVote,
} from "@/lib/community/votes";
import { prisma } from "@/lib/db/prisma";
import { toDeckRating } from "@/lib/ratings/mappers";
import {
  calculateAverageRating,
  getDeckQualityBadge,
} from "@/lib/ratings/ratings";

/** Hard cap on a single listing; discovery is a browse surface, not an export. */
const MAX_DECKS = 50;

/** What a discovery row renders, plus the votes and ratings it is scored from. */
const DISCOVERY_DECK_SELECT = {
  id: true,
  name: true,
  format: true,
  commanderName: true,
  updatedAt: true,
  user: { select: { name: true, username: true, image: true } },
  cards: {
    where: { isCommander: true },
    select: { name: true, imageUri: true, artCropUri: true },
    take: 1,
  },
  votes: { select: { userId: true, deckId: true, value: true } },
  ratings: {
    select: {
      id: true,
      userId: true,
      deckId: true,
      rating: true,
      title: true,
      body: true,
      helpfulCount: true,
      createdAt: true,
    },
  },
  _count: { select: { cards: true } },
} as const satisfies Prisma.DeckSelect;

type DiscoveryDeckRecord = Prisma.DeckGetPayload<{
  select: typeof DISCOVERY_DECK_SELECT;
}>;

/** A summary before ranking, which compares `updatedAt` as a date. */
type RankableSummary = Omit<CommanderDeckSummary, "updatedAt"> & {
  readonly updatedAt: Date;
};

/**
 * Ids of the public decks led by the commander whose name slugifies to `slug`.
 *
 * The slug is matched in SQL against the denormalised Deck.commanderName with
 * the SQL twin of commanderToSlug, the expression the partial index
 * Deck_commanderSlug_v2_public_idx covers (migration 20261111210000): Unicode
 * NFD, ASCII lowercase, JavaScript's whitespace mapped to a space, strip what
 * is not [a-z0-9 -], trim, runs of spaces to '-'. Each backslash is doubled
 * because this is a JavaScript template literal. Prisma cannot filter on an
 * expression, hence the raw id query.
 */
async function findPublicDeckIdsByCommanderSlug(
  slug: string
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Deck"
    WHERE "isPublic" = true
      AND "commanderName" IS NOT NULL
      AND regexp_replace(
            btrim(regexp_replace(
              regexp_replace(
                lower(normalize("commanderName", NFD) COLLATE "C"),
                '[\\t\\n\\v\\f\\r \\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]', ' ', 'g'
              ),
              '[^a-z0-9 -]', '', 'g'
            )),
            ' +', '-', 'g'
          ) = ${slug}
  `;
  return rows.map((row) => row.id);
}

/**
 * A stored vote is always 1 or -1: the vote route accepts nothing else. The
 * guard narrows the column's `number` without a cast.
 */
function isDeckVote(
  vote: DiscoveryDeckRecord["votes"][number]
): vote is DeckVote {
  return isValidVoteValue(vote.value);
}

/**
 * The commander as the row shows it: the `isCommander` card when the deck has
 * one, otherwise a commander named after the denormalised `commanderName`
 * with no image, which the row renders as the card back.
 *
 * A deck can carry a `commanderName` and no `isCommander` row: before #1444
 * the command zone was saved in three requests, and a failure between them
 * left exactly that state, and `PATCH /api/decks/[id]` still accepts
 * `commanderName` on its own. Such a deck is listed rather than dropped or
 * left to break the page. `.at(0)` keeps the absence visible to `tsc`.
 *
 * The SQL match requires a non-null `commanderName`, so the empty name only
 * covers a deck whose name was cleared between the id query and the hydration.
 */
function discoveryCommanderOf(deck: DiscoveryDeckRecord): DiscoveryCommander {
  return (
    deck.cards.at(0) ?? {
      name: deck.commanderName ?? "",
      imageUri: "",
      artCropUri: "",
    }
  );
}

/** One discovery row, with the viewer's own vote picked out of the tally. */
function summarize(
  deck: DiscoveryDeckRecord,
  viewerId: string | null
): RankableSummary {
  const ratings = deck.ratings.map(toDeckRating);
  const votes = deck.votes.filter(isDeckVote);
  const tally = calculateVoteScore(votes);

  return {
    viewerVote: votes.find((vote) => vote.userId === viewerId)?.value ?? null,
    id: deck.id,
    name: deck.name,
    format: deck.format,
    updatedAt: deck.updatedAt,
    cardCount: deck._count.cards,
    commander: discoveryCommanderOf(deck),
    author: deck.user,
    score: tally.score,
    upvotes: tally.upvotes,
    downvotes: tally.downvotes,
    averageRating: calculateAverageRating(ratings),
    ratingCount: ratings.length,
    badge: getDeckQualityBadge(ratings),
  };
}

/** Dates become ISO strings, so the cached read, the fresh read and the route agree. */
function toSummary(summary: RankableSummary): CommanderDeckSummary {
  return { ...summary, updatedAt: summary.updatedAt.toISOString() };
}

async function readCommanderDecks(
  slug: string,
  viewerId: string | null
): Promise<CommanderDecksResponse> {
  const matchingIds = await findPublicDeckIdsByCommanderSlug(slug);
  const decks = await prisma.deck.findMany({
    where: { id: { in: matchingIds } },
    select: DISCOVERY_DECK_SELECT,
  });

  const summaries = decks.map((deck) => summarize(deck, viewerId));
  const ranked = rankDecksByScore(summaries).slice(0, MAX_DECKS);

  return {
    slug,
    // Rows saved before the commanderName backfill still name their commander
    // through the commander card.
    commanderName: decks[0]?.commanderName ?? decks[0]?.cards[0]?.name ?? null,
    total: summaries.length,
    decks: ranked.map(toSummary),
  };
}

/** A signed-out visitor's read, served from Next's data cache for a minute. */
function readAnonymousCommanderDecksCached(
  slug: string
): Promise<CommanderDecksResponse> {
  return unstable_cache(
    (commanderSlug: string) => readCommanderDecks(commanderSlug, null),
    ["commander-decks"],
    { revalidate: ANONYMOUS_READ_REVALIDATE_SECONDS }
  )(slug);
}

/**
 * Finds the public decks led by the commander behind `slug`, as `viewerId`
 * may see them, reading the database on every call.
 *
 * For `GET /api/community/commanders/[slug]/decks`.
 *
 * @param slug - the commander slug from the URL; a slug no commander name can
 *   produce matches nothing and answers an empty listing
 * @param viewerId - the signed-in user's id, or null for a signed-out viewer
 * @returns the ranked listing, empty when no public deck leads with the commander
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findCommanderDecks(
  slug: string,
  viewerId: string | null
): Promise<CommanderDecksResponse> {
  return readCommanderDecks(slug, viewerId);
}

/**
 * Finds the listing behind `slug` for a page render: a signed-out visitor's
 * read comes from Next's data cache for
 * {@link ANONYMOUS_READ_REVALIDATE_SECONDS}, so a popular commander costs one
 * database read a minute; a signed-in viewer's read is fresh, so their
 * `viewerVote` never reaches another viewer.
 *
 * For the commander decks page (`/commanders/[slug]/decks`).
 *
 * @param slug - the commander slug from the URL; callers reject slugs that
 *   fail `isCommanderSlug` before calling, which keeps junk out of the cache
 * @param viewerId - the signed-in user's id, or null for a signed-out viewer
 * @returns the ranked listing, empty when no public deck leads with the commander
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findCommanderDecksForViewer(
  slug: string,
  viewerId: string | null
): Promise<CommanderDecksResponse> {
  return viewerId === null
    ? readAnonymousCommanderDecksCached(slug)
    : readCommanderDecks(slug, viewerId);
}
