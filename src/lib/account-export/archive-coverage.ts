/**
 * Which archive section holds the rows of each relation from a model to
 * `User`, and why the others are left out (I-38 requirement 7.1: "everything
 * tied to the account").
 *
 * Identity context, pure. A relation is keyed `Model.field`, the field whose
 * type is `User` in `prisma/schema.prisma`. The guard test
 * (`archive-coverage.test.ts`) reads the schema and fails, naming the model,
 * when a relation to `User` is in neither table: a new user-owned model
 * cannot ship without a decision about the export.
 *
 * @module account-export/archive-coverage
 */
import type { ArchiveSection } from "./archive-schema";

/** The archive section each exported relation to `User` lands in. */
export const EXPORTED_USER_RELATIONS: Readonly<Record<string, ArchiveSection>> =
  {
    "AcquisitionIntent.user": "acquisitionIntents",
    "AiUsage.user": "aiUsage",
    "ApiKey.user": "apiKeys",
    "CardPackage.author": "cardPackages",
    "CollectionCard.user": "collection",
    "Deck.user": "decks",
    "DeckComment.user": "comments",
    "DeckFolder.user": "deckFolders",
    "DeckRating.user": "ratings",
    "DeckReport.user": "reportsFiled",
    "DeckVote.user": "votes",
    "NotificationPreference.user": "notificationPreferences",
    "PlaytestSession.user": "playtests",
    "PublicDeckFolder.user": "publicDeckFolders",
    "SavedPublicDeck.user": "savedDecks",
    "UsageCounter.user": "aiUsage",
    "UserFollow.follower": "following",
    "UserFollow.following": "followers",
  };

/** The relations to `User` kept out of the archive on purpose, with the reason. */
export const EXCLUDED_USER_RELATIONS: Readonly<Record<string, string>> = {
  "Account.user":
    "OAuth link: its rows hold the provider's access, refresh and id tokens, which are credentials. The provider name is not worth the risk of a select drifting.",
  "Session.user":
    "Session rows hold session tokens, which are credentials. Sessions are JWTs today, so the table is empty in practice.",
  "DeckReport.reviewedBy":
    "A moderator's review of another player's report: the row is that player's report, not the moderator's own content. Decisions get their own model in I-38 slice 10.",
};

/**
 * Models tied to an account without a relation to `User`, kept out of the
 * archive on purpose, with the reason. The guard cannot find these from the
 * schema, so they are listed by hand.
 */
export const EXCLUDED_UNLINKED_MODELS: Readonly<Record<string, string>> = {
  VerificationToken:
    "One-time sign-in tokens keyed by email, deleted once used or expired. They are credentials and hold nothing else.",
};
