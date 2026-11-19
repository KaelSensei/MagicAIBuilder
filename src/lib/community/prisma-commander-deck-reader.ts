/**
 * The `CommanderDeckReader` port over PostgreSQL: the public decks whose
 * denormalised `Deck.commanderName` slugifies to a commander slug, with their
 * votes and ratings.
 *
 * Community context, commander discovery. Implements
 * `commander-discovery-port.ts` for `listCommanderDecks`; wired by
 * `commander-decks-lookup.ts`. Three queries whatever the number of matches:
 * a raw id query, because Prisma cannot filter on an expression, then, side
 * by side, a `findMany` that hydrates the matching rows and one
 * `deckCard.groupBy` that sums their card copies (`countDeckCardCopies`, the
 * deck list's count). The reader loads every match; the listing caps them
 * after ranking (`COMMANDER_DECKS_LIMIT`).
 *
 * @module community/prisma-commander-deck-reader
 */
import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  CommanderDeckReader,
  DiscoveryDeckRecord,
} from "@/lib/community/commander-discovery-port";
import { isValidVoteValue, type DeckVote } from "@/lib/community/votes";
import { countDeckCardCopies } from "@/lib/deck/prisma-deck-card-copies";
import { toDeckRating } from "@/lib/ratings/mappers";

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
} as const satisfies Prisma.DeckSelect;

type DiscoveryDeckRow = Prisma.DeckGetPayload<{
  select: typeof DISCOVERY_DECK_SELECT;
}>;

/**
 * A stored vote is always 1 or -1: the vote route accepts nothing else. The
 * guard narrows the column's `number` without a cast, and leaves out any
 * other value rather than counting it.
 */
function isDeckVote(vote: DiscoveryDeckRow["votes"][number]): vote is DeckVote {
  return isValidVoteValue(vote.value);
}

/**
 * The row in the port's shape, with the card copies `countDeckCardCopies`
 * summed for it. `.at(0)` keeps a missing commander card visible to `tsc`.
 */
function toDiscoveryDeckRecord(
  deck: DiscoveryDeckRow,
  cardCount: number
): DiscoveryDeckRecord {
  return {
    id: deck.id,
    name: deck.name,
    format: deck.format,
    commanderName: deck.commanderName,
    updatedAt: deck.updatedAt,
    cardCount,
    commanderCard: deck.cards.at(0) ?? null,
    author: deck.user,
    votes: deck.votes.filter(isDeckVote),
    ratings: deck.ratings.map(toDeckRating),
  };
}

/**
 * The commander deck reader over `client`.
 *
 * @param client - the Prisma client to run on; the shared one in production,
 *   a `stubPrisma` in tests
 */
export function prismaCommanderDeckReader(
  client: PrismaClient
): CommanderDeckReader {
  /**
   * Ids of the public decks led by the commander whose name slugifies to `slug`.
   *
   * The slug is matched in SQL against the denormalised Deck.commanderName with
   * the SQL twin of commanderToSlug, the expression the partial index
   * Deck_commanderSlug_v2_public_idx covers (migration 20261111210000): Unicode
   * NFD, ASCII lowercase, JavaScript's whitespace mapped to a space, strip what
   * is not [a-z0-9 -], trim, runs of spaces to '-'. Each backslash is doubled
   * because this is a JavaScript template literal. `commander-slug-parity.test.ts`
   * checks this file still ships the recorded expression.
   */
  async function findPublicDeckIdsByCommanderSlug(
    slug: string
  ): Promise<string[]> {
    const rows = await client.$queryRaw<{ id: string }[]>`
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

  return {
    async listPublicDecksByCommanderSlug(slug) {
      const matchingIds = await findPublicDeckIdsByCommanderSlug(slug);
      const [decks, cardCounts] = await Promise.all([
        client.deck.findMany({
          where: { id: { in: matchingIds } },
          select: DISCOVERY_DECK_SELECT,
        }),
        countDeckCardCopies(client, matchingIds),
      ]);
      return decks.map((deck) =>
        toDiscoveryDeckRecord(deck, cardCounts.get(deck.id) ?? 0)
      );
    },
  };
}
