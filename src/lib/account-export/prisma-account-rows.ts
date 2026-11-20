/**
 * Reads every row tied to one account, for the account archive (I-38
 * requirement 7).
 *
 * Identity context, Prisma adapter. The columns come from
 * `account-row-selects.ts`. Every `where` is scoped to the account: by its id,
 * or by the ids of rows it owns (its decks, its packages, the players in its
 * follows), so another player's rows cannot come back.
 *
 * Not a snapshot read: the queries run concurrently, so a row written while
 * the export runs may or may not appear. A read-only export needs no stronger
 * guarantee.
 *
 * @module account-export/prisma-account-rows
 */
import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  ACQUISITION_INTENT,
  AI_CALL,
  API_KEY,
  CARD_PACKAGE,
  COLLECTION_CARD,
  COMMENT,
  DECK,
  DECK_CARD,
  FOLDER,
  FOLLOW,
  HANDLE,
  NOTIFICATION_PREFERENCES,
  PACKAGE_CARD,
  PLAYTEST,
  PROFILE,
  RATING,
  REPORT,
  RULE_ZERO_SHEET,
  SAVED_DECK,
  SNAPSHOT,
  USAGE_COUNTER,
  VOTE,
  type AccountRows,
} from "./account-row-selects";

/** The rows found by the account's own id, before the rows found through them. */
type OwnedRows = Omit<
  AccountRows,
  "deckCards" | "snapshots" | "packageCards" | "handles"
>;

/**
 * Reads every row tied to the account.
 *
 * @param userId - The signed-in account's id, as `requireAuth` resolved it.
 * @returns The rows, or null when no account has this id (deleted meanwhile).
 */
export async function readAccountRows(
  userId: string
): Promise<AccountRows | null> {
  const owned = await readOwnedRows(userId);
  if (owned === null) return null;
  const otherPlayers = [
    ...owned.following.map((edge) => edge.followingId),
    ...owned.followers.map((edge) => edge.followerId),
  ];
  const deckIds = { in: owned.decks.map((deck) => deck.id) };
  const packageIds = { in: owned.cardPackages.map((pack) => pack.id) };
  const [deckCards, snapshots, packageCards, handles] = await Promise.all([
    prisma.deckCard.findMany({ where: { deckId: deckIds }, select: DECK_CARD }),
    prisma.deckSnapshot.findMany({
      where: { deckId: deckIds },
      select: SNAPSHOT,
    }),
    prisma.cardPackageCard.findMany({
      where: { packageId: packageIds },
      select: PACKAGE_CARD,
    }),
    prisma.user.findMany({
      where: { id: { in: otherPlayers } },
      select: HANDLE,
    }),
  ]);
  return { ...owned, deckCards, snapshots, packageCards, handles };
}

/** @returns the rows whose owning column is the account's id, or null with no account */
async function readOwnedRows(userId: string): Promise<OwnedRows | null> {
  const [deckbuilding, community, settings] = await Promise.all([
    readDeckbuildingRows(userId),
    readCommunityRows(userId),
    readSettingsRows(userId),
  ]);
  if (deckbuilding.profile === null) return null;
  return {
    ...deckbuilding,
    profile: deckbuilding.profile,
    ...community,
    ...settings,
  };
}

/** The profile, decks, folders, collection, plans and packages. */
async function readDeckbuildingRows(userId: string) {
  const byUser = { where: { userId } };
  const [
    profile,
    decks,
    deckFolders,
    collection,
    acquisitionIntents,
    ruleZeroSheets,
    cardPackages,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: PROFILE }),
    prisma.deck.findMany({ ...byUser, select: DECK }),
    prisma.deckFolder.findMany({ ...byUser, select: FOLDER }),
    prisma.collectionCard.findMany({ ...byUser, select: COLLECTION_CARD }),
    prisma.acquisitionIntent.findMany({
      ...byUser,
      select: ACQUISITION_INTENT,
    }),
    prisma.ruleZeroSheet.findMany({
      where: { ownerId: userId },
      select: RULE_ZERO_SHEET,
    }),
    prisma.cardPackage.findMany({
      where: { authorId: userId },
      select: CARD_PACKAGE,
    }),
  ]);
  return {
    profile,
    decks,
    deckFolders,
    collection,
    acquisitionIntents,
    ruleZeroSheets,
    cardPackages,
  };
}

/** Ratings, votes, comments, playtests and both directions of follows. */
async function readCommunityRows(userId: string) {
  const byUser = { where: { userId } };
  const [ratings, votes, comments, playtests, following, followers] =
    await Promise.all([
      prisma.deckRating.findMany({ ...byUser, select: RATING }),
      prisma.deckVote.findMany({ ...byUser, select: VOTE }),
      prisma.deckComment.findMany({ ...byUser, select: COMMENT }),
      prisma.playtestSession.findMany({ ...byUser, select: PLAYTEST }),
      prisma.userFollow.findMany({
        where: { followerId: userId },
        select: FOLLOW,
      }),
      prisma.userFollow.findMany({
        where: { followingId: userId },
        select: FOLLOW,
      }),
    ]);
  return { ratings, votes, comments, playtests, following, followers };
}

/** Bookmarks, settings, API keys, reports filed and AI usage. */
async function readSettingsRows(userId: string) {
  const byUser = { where: { userId } };
  const [
    savedDecks,
    publicDeckFolders,
    notificationPreferences,
    apiKeys,
    reportsFiled,
    usageCounters,
    aiCalls,
  ] = await Promise.all([
    prisma.savedPublicDeck.findMany({ ...byUser, select: SAVED_DECK }),
    prisma.publicDeckFolder.findMany({ ...byUser, select: FOLDER }),
    prisma.notificationPreference.findUnique({
      ...byUser,
      select: NOTIFICATION_PREFERENCES,
    }),
    prisma.apiKey.findMany({ ...byUser, select: API_KEY }),
    prisma.deckReport.findMany({ ...byUser, select: REPORT }),
    prisma.usageCounter.findMany({ ...byUser, select: USAGE_COUNTER }),
    prisma.aiUsage.findMany({ ...byUser, select: AI_CALL }),
  ]);
  return {
    savedDecks,
    publicDeckFolders,
    notificationPreferences,
    apiKeys,
    reportsFiled,
    usageCounters,
    aiCalls,
  };
}
