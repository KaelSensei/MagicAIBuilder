/**
 * Reads a public profile as a given viewer may see it.
 *
 * The account's public fields and public decks come through
 * {@link PUBLIC_PROFILE_SELECT}, an allowlist; the community stats (follow
 * counts, the viewer's own follow, the player badges) are computed beside
 * them. This module only gathers the counts: the badge thresholds and the
 * trending rule are the pure functions of `@/lib/social/player-badges`.
 * `isFollowing` is the one viewer-relative field, so a signed-in
 * viewer's read is never cached, while a signed-out visitor's read may be
 * served from Next's data cache for {@link ANONYMOUS_READ_REVALIDATE_SECONDS}.
 *
 * Shared by `GET /api/users/[username]` and the profile page
 * (`/u/[username]`), so the page reads the database in-process instead of
 * calling the app's own API over HTTP: no base URL to guess, no self-call that
 * a deployment-protected preview would refuse.
 *
 * @module social/public-profile-lookup
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { ANONYMOUS_READ_REVALIDATE_SECONDS } from "@/lib/community/anonymous-read-cache";
import { prisma } from "@/lib/db/prisma";
import { calculateAverageRating } from "@/lib/ratings/ratings";
import {
  countTrendingDecks,
  getPlayerBadges,
  type PlayerBadge,
} from "@/lib/social/player-badges";
import type { PublicProfile } from "@/lib/social/public-profile";

/**
 * The account columns and public decks a visitor may read. Never the email or
 * any account setting; never a private deck.
 */
const PUBLIC_PROFILE_SELECT = {
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
} as const satisfies Prisma.UserSelect;

/** The account row, matched case-insensitively: `/u/Kael` and `/u/kael` are one profile. */
function readProfileRecord(username: string) {
  return prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: PUBLIC_PROFILE_SELECT,
  });
}

type ProfileRow = NonNullable<Awaited<ReturnType<typeof readProfileRecord>>>;

/** A row the lookup matched on its username, so the nullable column is set. */
type ProfileRecord = ProfileRow & { readonly username: string };

/**
 * The lookup matched the row on `username`, so the column cannot be null; the
 * guard narrows it without a cast. An account with no username yet is not a
 * claimed profile and reads as missing.
 */
function isClaimedProfile(row: ProfileRow): row is ProfileRecord {
  return row.username !== null;
}

/** The community stats shown alongside a public profile. */
interface CommunityStats {
  readonly followerCount: number;
  readonly followingCount: number;
  readonly isFollowing: boolean;
  readonly badges: readonly PlayerBadge[];
}

/**
 * Follow counts, the viewer's follow state and the earned badges.
 *
 * The owner is never reported as following themselves, and the follow row is
 * not even looked up for them or for a signed-out viewer. The rating rows are
 * read without their review text: the badge rules need the star, the deck
 * and the date, and that selection already is a `DeckRating`.
 */
async function loadCommunityStats(
  userId: string,
  deckIds: readonly string[],
  viewerId: string | null
): Promise<CommunityStats> {
  const isSelf = viewerId === userId;

  const [followerCount, followingCount, viewerFollow, ratingRows] =
    await Promise.all([
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.count({ where: { followerId: userId } }),
      viewerId && !isSelf
        ? prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: userId,
              },
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

  return {
    followerCount,
    followingCount,
    isFollowing: viewerFollow !== null,
    badges: getPlayerBadges({
      publicDeckCount: deckIds.length,
      averageRating: calculateAverageRating(ratingRows),
      trendingDecksCount: countTrendingDecks(ratingRows, Date.now()),
    }),
  };
}

/**
 * The profile a visitor receives. Dates become ISO strings here, so the
 * cached read, the fresh read and the HTTP route all answer the same shape.
 */
function toPublicProfile(
  record: ProfileRecord,
  stats: CommunityStats
): PublicProfile {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    decks: record.decks.map((deck) => ({
      ...deck,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    })),
    ...stats,
  };
}

async function readPublicProfile(
  username: string,
  viewerId: string | null
): Promise<PublicProfile | null> {
  const record = await readProfileRecord(username);
  if (!record || !isClaimedProfile(record)) return null;
  const deckIds = record.decks.map((deck) => deck.id);
  return toPublicProfile(
    record,
    await loadCommunityStats(record.id, deckIds, viewerId)
  );
}

/** A signed-out visitor's read, served from Next's data cache for a minute. */
function readAnonymousPublicProfileCached(
  username: string
): Promise<PublicProfile | null> {
  return unstable_cache(
    (name: string) => readPublicProfile(name, null),
    ["public-profile"],
    { revalidate: ANONYMOUS_READ_REVALIDATE_SECONDS }
  )(username);
}

/**
 * Finds the profile behind `username` as `viewerId` may see it, reading the
 * database on every call.
 *
 * For `GET /api/users/[username]`.
 *
 * @param username - the `[username]` segment; callers reject values that fail
 *   `isUsername` before calling
 * @param viewerId - the signed-in user's id, or null for a signed-out viewer
 * @returns the profile, or null when no account carries the username
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findPublicProfile(
  username: string,
  viewerId: string | null
): Promise<PublicProfile | null> {
  return readPublicProfile(username, viewerId);
}

/**
 * Finds the profile behind `username` for a page render: a signed-out
 * visitor's read comes from Next's data cache for
 * {@link ANONYMOUS_READ_REVALIDATE_SECONDS}, so a popular profile costs one
 * database read a minute; a signed-in viewer's read is fresh, so their
 * `isFollowing` never reaches another viewer.
 *
 * For the profile page (`/u/[username]`).
 *
 * @param username - the `[username]` segment; callers reject values that fail
 *   `isUsername` before calling, which keeps junk out of the cache
 * @param viewerId - the signed-in user's id, or null for a signed-out viewer
 * @returns the profile, or null when no account carries the username
 * @throws whatever Prisma throws when the database is unavailable
 */
export function findPublicProfileForViewer(
  username: string,
  viewerId: string | null
): Promise<PublicProfile | null> {
  return viewerId === null
    ? readAnonymousPublicProfileCached(username)
    : readPublicProfile(username, viewerId);
}
