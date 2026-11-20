/**
 * The columns the account export reads from each table, and the row types
 * those reads return (I-38 requirement 7).
 *
 * Identity context. Each select names its columns (never a bare `include`),
 * so a column added to a model later stays out of the archive until someone
 * adds it here and to `archive-schema.ts`. Credentials are never selected:
 * `User.password`, `ApiKey.tokenHash` and `displayPrefix`, `Deck.shareToken`;
 * `Account`, `Session` and `VerificationToken` are not read at all
 * (`archive-coverage.ts`).
 *
 * @module account-export/account-row-selects
 */
import type { Prisma } from "@prisma/client";

/** The profile: an allow-list of `User` columns, never the password hash. */
export const PROFILE = {
  id: true,
  username: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  onboardingDone: true,
  isModerator: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

/** A deck's own columns; its share token is a credential and stays out. */
export const DECK = {
  id: true,
  name: true,
  description: true,
  tags: true,
  format: true,
  targetBracket: true,
  manualBracket: true,
  budget: true,
  pairingType: true,
  isPublic: true,
  shareEnabled: true,
  seekingFeedback: true,
  feedbackQuestion: true,
  isAIGenerated: true,
  forkedFromDeckId: true,
  forkedFromDeckName: true,
  forkedFromUserName: true,
  folderId: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DeckSelect;

export const DECK_CARD = {
  deckId: true,
  scryfallId: true,
  name: true,
  quantity: true,
  zone: true,
  category: true,
  isCommander: true,
  isPartner: true,
  notes: true,
} as const satisfies Prisma.DeckCardSelect;

export const SNAPSHOT = {
  id: true,
  deckId: true,
  name: true,
  commander: true,
  cardCount: true,
  cardList: true,
  createdAt: true,
} as const satisfies Prisma.DeckSnapshotSelect;

/** A deck folder or a public deck folder: both have the same columns. */
export const FOLDER = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DeckFolderSelect & Prisma.PublicDeckFolderSelect;

export const COLLECTION_CARD = {
  scryfallId: true,
  name: true,
  quantity: true,
  foil: true,
  condition: true,
  acquiredAt: true,
  price: true,
  createdAt: true,
} as const satisfies Prisma.CollectionCardSelect;

export const ACQUISITION_INTENT = {
  deckId: true,
  scryfallId: true,
  mode: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.AcquisitionIntentSelect;

export const CARD_PACKAGE = {
  id: true,
  name: true,
  description: true,
  category: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CardPackageSelect;

export const PACKAGE_CARD = {
  packageId: true,
  scryfallId: true,
  name: true,
  quantity: true,
} as const satisfies Prisma.CardPackageCardSelect;

export const RATING = {
  deckId: true,
  rating: true,
  title: true,
  body: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DeckRatingSelect;

export const VOTE = {
  deckId: true,
  value: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DeckVoteSelect;

export const COMMENT = {
  id: true,
  deckId: true,
  parentId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DeckCommentSelect;

export const PLAYTEST = {
  id: true,
  deckId: true,
  snapshotId: true,
  result: true,
  turns: true,
  mulliganCount: true,
  difficulty: true,
  notes: true,
  proposedChange: true,
  cardsSeen: true,
  additionalCardsSeen: true,
  createdAt: true,
} as const satisfies Prisma.PlaytestSessionSelect;

export const FOLLOW = {
  followerId: true,
  followingId: true,
  createdAt: true,
} as const satisfies Prisma.UserFollowSelect;

/** The other player of a follow: the public handle, never the email. */
export const HANDLE = {
  id: true,
  username: true,
} as const satisfies Prisma.UserSelect;

export const SAVED_DECK = {
  deckId: true,
  folderId: true,
  createdAt: true,
} as const satisfies Prisma.SavedPublicDeckSelect;

export const NOTIFICATION_PREFERENCES = {
  replies: true,
  mentions: true,
  follows: true,
  watchedDecks: true,
  updatedAt: true,
} as const satisfies Prisma.NotificationPreferenceSelect;

/** An API key's label, scopes and dates; never its hash or display prefix. */
export const API_KEY = {
  name: true,
  scopes: true,
  createdAt: true,
  expiresAt: true,
  revokedAt: true,
  lastUsedAt: true,
} as const satisfies Prisma.ApiKeySelect;

/** A report the account filed; the reviewing moderator's id stays out. */
export const REPORT = {
  deckId: true,
  reason: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DeckReportSelect;

export const USAGE_COUNTER = {
  key: true,
  periodStart: true,
  used: true,
} as const satisfies Prisma.UsageCounterSelect;

/** One metered AI call: what was asked of whom and how it ended, not what it cost us. */
export const AI_CALL = {
  route: true,
  provider: true,
  model: true,
  outcome: true,
  createdAt: true,
} as const satisfies Prisma.AiUsageSelect;

/** One row of a section of {@link AccountRows}, e.g. `RowOf<"decks">`. */
export type RowOf<Section extends keyof AccountRows> =
  NonNullable<AccountRows[Section]> extends readonly (infer Item)[]
    ? Item
    : NonNullable<AccountRows[Section]>;

/** One follow edge, both ends as ids; the archive keeps only the other end's handle. */
export type FollowRow = Prisma.UserFollowGetPayload<{ select: typeof FOLLOW }>;

/** Every row the account archive is built from, as the selects above read them. */
export interface AccountRows {
  readonly profile: Prisma.UserGetPayload<{ select: typeof PROFILE }>;
  readonly decks: readonly Prisma.DeckGetPayload<{ select: typeof DECK }>[];
  readonly deckCards: readonly Prisma.DeckCardGetPayload<{
    select: typeof DECK_CARD;
  }>[];
  readonly snapshots: readonly Prisma.DeckSnapshotGetPayload<{
    select: typeof SNAPSHOT;
  }>[];
  readonly deckFolders: readonly Prisma.DeckFolderGetPayload<{
    select: typeof FOLDER;
  }>[];
  readonly collection: readonly Prisma.CollectionCardGetPayload<{
    select: typeof COLLECTION_CARD;
  }>[];
  readonly acquisitionIntents: readonly Prisma.AcquisitionIntentGetPayload<{
    select: typeof ACQUISITION_INTENT;
  }>[];
  readonly cardPackages: readonly Prisma.CardPackageGetPayload<{
    select: typeof CARD_PACKAGE;
  }>[];
  readonly packageCards: readonly Prisma.CardPackageCardGetPayload<{
    select: typeof PACKAGE_CARD;
  }>[];
  readonly ratings: readonly Prisma.DeckRatingGetPayload<{
    select: typeof RATING;
  }>[];
  readonly votes: readonly Prisma.DeckVoteGetPayload<{ select: typeof VOTE }>[];
  readonly comments: readonly Prisma.DeckCommentGetPayload<{
    select: typeof COMMENT;
  }>[];
  readonly playtests: readonly Prisma.PlaytestSessionGetPayload<{
    select: typeof PLAYTEST;
  }>[];
  readonly following: readonly FollowRow[];
  readonly followers: readonly FollowRow[];
  readonly handles: readonly Prisma.UserGetPayload<{ select: typeof HANDLE }>[];
  readonly savedDecks: readonly Prisma.SavedPublicDeckGetPayload<{
    select: typeof SAVED_DECK;
  }>[];
  readonly publicDeckFolders: readonly Prisma.PublicDeckFolderGetPayload<{
    select: typeof FOLDER;
  }>[];
  readonly notificationPreferences: Prisma.NotificationPreferenceGetPayload<{
    select: typeof NOTIFICATION_PREFERENCES;
  }> | null;
  readonly apiKeys: readonly Prisma.ApiKeyGetPayload<{
    select: typeof API_KEY;
  }>[];
  readonly reportsFiled: readonly Prisma.DeckReportGetPayload<{
    select: typeof REPORT;
  }>[];
  readonly usageCounters: readonly Prisma.UsageCounterGetPayload<{
    select: typeof USAGE_COUNTER;
  }>[];
  readonly aiCalls: readonly Prisma.AiUsageGetPayload<{
    select: typeof AI_CALL;
  }>[];
}
