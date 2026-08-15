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
import { commanderToSlug } from "@/lib/meta/fetch";
import { calculateVoteScore, rankDecksByScore, type DeckVote } from "@/lib/community/votes";
import { calculateAverageRating, getDeckQualityBadge } from "@/lib/ratings/ratings";
import { toDeckRating, type DeckRatingRow } from "@/lib/ratings/mappers";

type Params = { params: Promise<{ slug: string }> };

/** Hard cap on a single response; discovery is a browse surface, not an export. */
const MAX_DECKS = 50;

// GET /api/community/commanders/[slug]/decks
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    // Commander identity lives on the deck's cards, not on the Deck row, so the
    // slug cannot be matched in SQL. Public decks are few enough to slug in
    // memory; revisit if that stops being true.
    const decks = await prisma.deck.findMany({
      where: {
        isPublic: true,
        cards: { some: { isCommander: true } },
      },
      select: {
        id: true,
        name: true,
        format: true,
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

    const matching = decks.filter(
      (deck) => deck.cards[0] && commanderToSlug(deck.cards[0].name) === slug
    );

    const summaries = matching.map((deck) => {
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
      commanderName: matching[0]?.cards[0]?.name ?? null,
      total: summaries.length,
      decks: ranked,
    });
  } catch (error) {
    logger.error("Unexpected error", "GET /api/community/commanders/:slug/decks", error);
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }
}
