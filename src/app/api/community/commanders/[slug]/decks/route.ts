/**
 * Public deck discovery for a commander.
 *
 * GET — every public deck led by the commander whose name slugifies to `slug`,
 * ordered by community vote score. No session required.
 *
 * Until now nothing listed public decks at all: `/api/decks` never filters on
 * `isPublic`, and `fetchPublicDeck` is single-deck-by-id.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { calculateVoteScore, rankDecksByScore, type DeckVote } from "@/lib/community/votes";
import { calculateAverageRating, getDeckQualityBadge } from "@/lib/ratings/ratings";
import { toDeckRating, type DeckRatingRow } from "@/lib/ratings/mappers";

type Params = { params: Promise<{ slug: string }> };

/** Hard cap on a single response; discovery is a browse surface, not an export. */
const MAX_DECKS = 50;

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
 *
 * @param slug The commander slug from the URL.
 * @returns The matching deck ids, in no particular order; empty when none match.
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

// GET /api/community/commanders/[slug]/decks
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;
    const matchingIds = await findPublicDeckIdsByCommanderSlug(slug);

    const decks = await prisma.deck.findMany({
      where: { id: { in: matchingIds } },
      select: {
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
      },
    });

    const summaries = decks.map((deck) => {
      const ratings = (deck.ratings as DeckRatingRow[]).map(toDeckRating);
      const votes = deck.votes as readonly DeckVote[];
      const tally = calculateVoteScore(votes);

      return {
        viewerVote: votes.find((v) => v.userId === viewerId)?.value ?? null,
        id: deck.id,
        name: deck.name,
        format: deck.format,
        updatedAt: deck.updatedAt,
        cardCount: deck._count.cards,
        commander: deck.cards[0],
        author: deck.user,
        score: tally.score,
        upvotes: tally.upvotes,
        downvotes: tally.downvotes,
        averageRating: calculateAverageRating(ratings),
        ratingCount: ratings.length,
        badge: getDeckQualityBadge(ratings),
      };
    });

    const ranked = rankDecksByScore(summaries).slice(0, MAX_DECKS);

    return NextResponse.json({
      slug,
      commanderName: decks[0]?.commanderName ?? decks[0]?.cards[0]?.name ?? null,
      total: summaries.length,
      decks: ranked,
    });
  } catch (error) {
    logger.error("Unexpected error", "GET /api/community/commanders/:slug/decks", error);
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }
}
