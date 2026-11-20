/**
 * Turns the rows read for one account into the published account archive
 * (I-38 requirement 7).
 *
 * Identity context, pure. Every field is copied by name, never spread from a
 * row, so the archive holds exactly what `archive-schema.ts` publishes: the
 * profile is an allow-list of `User` columns, a follow keeps only the other
 * player's public handle and the date, and an API key keeps its label and
 * dates. Dates become ISO 8601 strings, as they travel in the JSON body. The
 * deckbuilding sections are in `archive-deck-sections.ts`.
 *
 * @module account-export/build-account-archive
 */
import {
  ACCOUNT_ARCHIVE_SCHEMA_VERSION,
  type AccountArchive,
} from "./archive-schema";
import type { AccountRows, FollowRow, RowOf } from "./account-row-selects";
import { cardPackagesOf, decksOf, folderOf } from "./archive-deck-sections";

/** @returns the instant as ISO 8601, or null for no instant */
function isoOrNull(instant: Date | null): string | null {
  return instant === null ? null : instant.toISOString();
}

/**
 * Builds the account archive.
 *
 * @param rows - Everything `readAccountRows` read for the account.
 * @param generatedAt - When the export ran; written as `generatedAt`.
 * @returns The archive, ready to serialise.
 */
export function buildAccountArchive(
  rows: AccountRows,
  generatedAt: Date
): AccountArchive {
  return {
    schemaVersion: ACCOUNT_ARCHIVE_SCHEMA_VERSION,
    generatedAt: generatedAt.toISOString(),
    profile: profileOf(rows.profile),
    decks: decksOf(rows),
    deckFolders: rows.deckFolders.map(folderOf),
    collection: rows.collection.map(collectionCardOf),
    acquisitionIntents: rows.acquisitionIntents.map(acquisitionIntentOf),
    cardPackages: cardPackagesOf(rows),
    ratings: rows.ratings.map(ratingOf),
    votes: rows.votes.map(voteOf),
    comments: rows.comments.map(commentOf),
    playtests: rows.playtests.map(playtestOf),
    ...followsOf(rows),
    savedDecks: rows.savedDecks.map(savedDeckOf),
    publicDeckFolders: rows.publicDeckFolders.map(folderOf),
    notificationPreferences: notificationPreferencesOf(
      rows.notificationPreferences
    ),
    apiKeys: rows.apiKeys.map(apiKeyOf),
    reportsFiled: rows.reportsFiled.map(reportOf),
    aiUsage: aiUsageOf(rows),
  };
}

function profileOf(user: RowOf<"profile">): AccountArchive["profile"] {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    emailVerifiedAt: isoOrNull(user.emailVerified),
    image: user.image,
    onboardingDone: user.onboardingDone,
    isModerator: user.isModerator,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function collectionCardOf(
  card: RowOf<"collection">
): AccountArchive["collection"][number] {
  return {
    scryfallId: card.scryfallId,
    name: card.name,
    quantity: card.quantity,
    foil: card.foil,
    condition: card.condition,
    acquiredAt: isoOrNull(card.acquiredAt),
    price: card.price,
    createdAt: card.createdAt.toISOString(),
  };
}

function acquisitionIntentOf(
  intent: RowOf<"acquisitionIntents">
): AccountArchive["acquisitionIntents"][number] {
  return {
    deckId: intent.deckId,
    scryfallId: intent.scryfallId,
    mode: intent.mode,
    createdAt: intent.createdAt.toISOString(),
    updatedAt: intent.updatedAt.toISOString(),
  };
}

function ratingOf(rating: RowOf<"ratings">): AccountArchive["ratings"][number] {
  return {
    deckId: rating.deckId,
    rating: rating.rating,
    title: rating.title,
    body: rating.body,
    createdAt: rating.createdAt.toISOString(),
    updatedAt: rating.updatedAt.toISOString(),
  };
}

function voteOf(vote: RowOf<"votes">): AccountArchive["votes"][number] {
  return {
    deckId: vote.deckId,
    value: vote.value,
    createdAt: vote.createdAt.toISOString(),
    updatedAt: vote.updatedAt.toISOString(),
  };
}

function commentOf(
  comment: RowOf<"comments">
): AccountArchive["comments"][number] {
  return {
    id: comment.id,
    deckId: comment.deckId,
    parentId: comment.parentId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

function playtestOf(
  playtest: RowOf<"playtests">
): AccountArchive["playtests"][number] {
  return {
    id: playtest.id,
    deckId: playtest.deckId,
    snapshotId: playtest.snapshotId,
    result: playtest.result,
    turns: playtest.turns,
    mulliganCount: playtest.mulliganCount,
    difficulty: playtest.difficulty,
    notes: playtest.notes,
    proposedChange: playtest.proposedChange,
    cardsSeen: playtest.cardsSeen,
    additionalCardsSeen: playtest.additionalCardsSeen,
    createdAt: playtest.createdAt.toISOString(),
  };
}

/** Both directions of follows, each edge reduced to the other player's handle. */
function followsOf(
  rows: AccountRows
): Pick<AccountArchive, "following" | "followers"> {
  const handles = new Map(
    rows.handles.map((handle) => [handle.id, handle.username])
  );
  const edgeTo = (otherPlayerId: string, edge: FollowRow) => ({
    username: handles.get(otherPlayerId) ?? null,
    since: edge.createdAt.toISOString(),
  });
  return {
    following: rows.following.map((edge) => edgeTo(edge.followingId, edge)),
    followers: rows.followers.map((edge) => edgeTo(edge.followerId, edge)),
  };
}

function savedDeckOf(
  saved: RowOf<"savedDecks">
): AccountArchive["savedDecks"][number] {
  return {
    deckId: saved.deckId,
    folderId: saved.folderId,
    createdAt: saved.createdAt.toISOString(),
  };
}

function notificationPreferencesOf(
  preferences: AccountRows["notificationPreferences"]
): AccountArchive["notificationPreferences"] {
  if (preferences === null) return null;
  return {
    replies: preferences.replies,
    mentions: preferences.mentions,
    follows: preferences.follows,
    watchedDecks: preferences.watchedDecks,
    updatedAt: preferences.updatedAt.toISOString(),
  };
}

function apiKeyOf(key: RowOf<"apiKeys">): AccountArchive["apiKeys"][number] {
  return {
    name: key.name,
    scopes: [...key.scopes],
    createdAt: key.createdAt.toISOString(),
    expiresAt: isoOrNull(key.expiresAt),
    revokedAt: isoOrNull(key.revokedAt),
    lastUsedAt: isoOrNull(key.lastUsedAt),
  };
}

function reportOf(
  report: RowOf<"reportsFiled">
): AccountArchive["reportsFiled"][number] {
  return {
    deckId: report.deckId,
    reason: report.reason,
    status: report.status,
    reviewedAt: isoOrNull(report.reviewedAt),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

function aiUsageOf(rows: AccountRows): AccountArchive["aiUsage"] {
  return {
    monthlyCounts: rows.usageCounters.map((counter) => ({
      key: counter.key,
      periodStart: counter.periodStart.toISOString(),
      used: counter.used,
    })),
    calls: rows.aiCalls.map((call) => ({
      route: call.route,
      provider: call.provider,
      model: call.model,
      outcome: call.outcome,
      createdAt: call.createdAt.toISOString(),
    })),
  };
}
