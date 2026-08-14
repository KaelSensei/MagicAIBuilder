import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { calculateAverageRating } from "@/lib/ratings/ratings";
import { getPlayerBadges, type PlayerBadge } from "@/lib/social/follow";
import { toDeckRating, type DeckRatingRow } from "@/lib/ratings/mappers";

type Params = { params: Promise<{ username: string }> };

/** A deck is trending once it has drawn this many ratings recently. */
const TRENDING_MIN_RATINGS = 3;
const TRENDING_WINDOW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rating fields needed for badge scoring — no review text. */
type ScoringRow = Pick<DeckRatingRow, "id" | "userId" | "deckId" | "rating" | "createdAt">;

/**
 * Counts how many of a user's decks are currently trending.
 *
 * @param rows Ratings across all of the user's public decks.
 * @param now Reference time for the trailing window.
 * @returns Number of decks over the recent-rating threshold.
 */
function countTrendingDecks(rows: readonly ScoringRow[], now: number): number {
  const cutoff = now - TRENDING_WINDOW_DAYS * MS_PER_DAY;
  const recentByDeck = new Map<string, number>();

  for (const row of rows) {
    if (row.createdAt.getTime() < cutoff) continue;
    recentByDeck.set(row.deckId, (recentByDeck.get(row.deckId) ?? 0) + 1);
  }

  let trending = 0;
  for (const count of recentByDeck.values()) {
    if (count >= TRENDING_MIN_RATINGS) trending += 1;
  }
  return trending;
}

/**
 * Resolves the community stats shown alongside a public profile.
 *
 * @param userId Profile owner id.
 * @param deckIds The owner's public deck ids.
 * @param viewerId Signed-in viewer id, or null when anonymous.
 * @returns Follower/following counts, viewer follow state, and earned badges.
 */
async function loadCommunityStats(
  userId: string,
  deckIds: readonly string[],
  viewerId: string | null
): Promise<{
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  badges: PlayerBadge[];
}> {
  const isSelf = viewerId === userId;

  const [followerCount, followingCount, viewerFollow, ratingRows] = await Promise.all([
    prisma.userFollow.count({ where: { followingId: userId } }),
    prisma.userFollow.count({ where: { followerId: userId } }),
    viewerId && !isSelf
      ? prisma.userFollow.findUnique({
          where: {
            followerId_followingId: { followerId: viewerId, followingId: userId },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    deckIds.length > 0
      ? prisma.deckRating.findMany({
          where: { deckId: { in: [...deckIds] } },
          select: {
            id: true,
            userId: true,
            deckId: true,
            rating: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const rows = ratingRows as ScoringRow[];

  return {
    followerCount,
    followingCount,
    isFollowing: viewerFollow !== null,
    badges: getPlayerBadges({
      publicDeckCount: deckIds.length,
      averageRating: calculateAverageRating(
        rows.map((row) => toDeckRating({ ...row, title: null, body: null, helpfulCount: 0 }))
      ),
      trendingDecksCount: countTrendingDecks(rows, Date.now()),
    }),
  };
}

// GET /api/users/[username] — public profile (no auth required)
export async function GET(_req: Request, { params }: Params) {
  const { username } = await params;

  if (!username || username.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    // Use findFirst with mode:insensitive to handle case-insensitive lookup
    // (e.g. /u/Kael and /u/kael both resolve to the same profile)
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
        decks: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            description: true,
            format: true,
            targetBracket: true,
            commanderId: true,
            isAIGenerated: true,
            createdAt: true,
            updatedAt: true,
            cards: {
              where: { isCommander: true },
              select: { name: true, artCropUri: true, imageUri: true },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const session = await auth();
    const stats = await loadCommunityStats(
      user.id,
      user.decks.map((deck) => deck.id),
      session?.user?.id ?? null
    );

    return NextResponse.json({ ...user, ...stats });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/users/:username",
      { username: String(username).slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
