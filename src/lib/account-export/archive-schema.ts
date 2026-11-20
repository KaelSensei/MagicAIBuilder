/**
 * The account archive: the one JSON document `GET /api/user/export` returns,
 * holding everything tied to a player's account (I-38 requirement 7; GDPR
 * Art. 15 access and Art. 20 portability).
 *
 * Identity context. This schema is the published contract
 * (`docs/engineering/account-export.md`): every object is strict, so a column
 * the export never meant to publish fails validation instead of leaking. Dates
 * are ISO 8601 strings in UTC, as `JSON.stringify` writes them.
 *
 * Versioning: `schemaVersion` moves by one whenever a field is removed or
 * changes meaning. Adding a section or an optional field does not move it.
 *
 * @module account-export/archive-schema
 */
import { z } from "zod";

/** The version of the archive this code writes. */
export const ACCOUNT_ARCHIVE_SCHEMA_VERSION = 1;

const instant = z.iso.datetime();

const profile = z.strictObject({
  id: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  email: z.string(),
  emailVerifiedAt: instant.nullable(),
  image: z.string().nullable(),
  onboardingDone: z.boolean(),
  isModerator: z.boolean(),
  createdAt: instant,
  updatedAt: instant,
});

const deckCard = z.strictObject({
  scryfallId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  zone: z.string(),
  category: z.string(),
  isCommander: z.boolean(),
  isPartner: z.boolean(),
  notes: z.string().nullable(),
});

const deckSnapshot = z.strictObject({
  id: z.string(),
  name: z.string(),
  commander: z.string().nullable(),
  cardCount: z.number().int(),
  /** The card list exactly as the snapshot stored it (a JSON column). */
  cardList: z.unknown(),
  createdAt: instant,
});

const deck = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  format: z.string(),
  targetBracket: z.number().int(),
  manualBracket: z.number().int().nullable(),
  budget: z.number().nullable(),
  pairingType: z.string(),
  isPublic: z.boolean(),
  shareEnabled: z.boolean(),
  seekingFeedback: z.boolean(),
  feedbackQuestion: z.string().nullable(),
  isAIGenerated: z.boolean(),
  forkedFromDeckId: z.string().nullable(),
  forkedFromDeckName: z.string().nullable(),
  forkedFromUserName: z.string().nullable(),
  folderId: z.string().nullable(),
  createdAt: instant,
  updatedAt: instant,
  cards: z.array(deckCard),
  snapshots: z.array(deckSnapshot),
  /** The deck as the builder's plain-text export writes it, for another deckbuilder. */
  plainText: z.string(),
});

const folder = z.strictObject({
  id: z.string(),
  name: z.string(),
  createdAt: instant,
  updatedAt: instant,
});

const collectionCard = z.strictObject({
  scryfallId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  foil: z.boolean(),
  condition: z.string().nullable(),
  acquiredAt: instant.nullable(),
  price: z.number().nullable(),
  createdAt: instant,
});

const acquisitionIntent = z.strictObject({
  deckId: z.string(),
  scryfallId: z.string(),
  mode: z.string(),
  createdAt: instant,
  updatedAt: instant,
});

const cardPackage = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  isPublic: z.boolean(),
  createdAt: instant,
  updatedAt: instant,
  cards: z.array(
    z.strictObject({
      scryfallId: z.string(),
      name: z.string(),
      quantity: z.number().int(),
    })
  ),
});

const rating = z.strictObject({
  deckId: z.string(),
  rating: z.number().int(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  createdAt: instant,
  updatedAt: instant,
});

const vote = z.strictObject({
  deckId: z.string(),
  value: z.number().int(),
  createdAt: instant,
  updatedAt: instant,
});

const comment = z.strictObject({
  id: z.string(),
  deckId: z.string(),
  parentId: z.string().nullable(),
  body: z.string(),
  createdAt: instant,
  updatedAt: instant,
});

const playtest = z.strictObject({
  id: z.string(),
  deckId: z.string(),
  snapshotId: z.string().nullable(),
  result: z.string(),
  turns: z.number().int(),
  mulliganCount: z.number().int(),
  difficulty: z.string().nullable(),
  notes: z.string().nullable(),
  proposedChange: z.string().nullable(),
  cardsSeen: z.number().int().nullable(),
  additionalCardsSeen: z.number().int().nullable(),
  createdAt: instant,
});

/** The other end of a follow: their public handle only, never their email. */
const followEdge = z.strictObject({
  username: z.string().nullable(),
  since: instant,
});

const savedDeck = z.strictObject({
  deckId: z.string(),
  folderId: z.string().nullable(),
  createdAt: instant,
});

const notificationPreferences = z.strictObject({
  replies: z.boolean(),
  mentions: z.boolean(),
  follows: z.boolean(),
  watchedDecks: z.boolean(),
  updatedAt: instant,
});

/** An API key's label and dates. Its hash and display prefix stay out. */
const apiKey = z.strictObject({
  name: z.string(),
  scopes: z.array(z.string()),
  createdAt: instant,
  expiresAt: instant.nullable(),
  revokedAt: instant.nullable(),
  lastUsedAt: instant.nullable(),
});

const reportFiled = z.strictObject({
  deckId: z.string(),
  reason: z.string(),
  status: z.string(),
  reviewedAt: instant.nullable(),
  createdAt: instant,
  updatedAt: instant,
});

const aiUsage = z.strictObject({
  monthlyCounts: z.array(
    z.strictObject({
      key: z.string(),
      periodStart: instant,
      used: z.number().int(),
    })
  ),
  calls: z.array(
    z.strictObject({
      route: z.string(),
      provider: z.string(),
      model: z.string(),
      outcome: z.string(),
      createdAt: instant,
    })
  ),
});

/** The whole archive, as published. */
export const accountArchiveSchema = z.strictObject({
  schemaVersion: z.literal(ACCOUNT_ARCHIVE_SCHEMA_VERSION),
  generatedAt: instant,
  profile,
  decks: z.array(deck),
  deckFolders: z.array(folder),
  collection: z.array(collectionCard),
  acquisitionIntents: z.array(acquisitionIntent),
  cardPackages: z.array(cardPackage),
  ratings: z.array(rating),
  votes: z.array(vote),
  comments: z.array(comment),
  playtests: z.array(playtest),
  following: z.array(followEdge),
  followers: z.array(followEdge),
  savedDecks: z.array(savedDeck),
  publicDeckFolders: z.array(folder),
  notificationPreferences: notificationPreferences.nullable(),
  apiKeys: z.array(apiKey),
  reportsFiled: z.array(reportFiled),
  aiUsage,
});

/** The account archive, as `GET /api/user/export` writes it. */
export type AccountArchive = z.infer<typeof accountArchiveSchema>;

/** A section of the archive that holds rows, as the coverage table names them. */
export type ArchiveSection = Exclude<
  keyof AccountArchive,
  "schemaVersion" | "generatedAt"
>;
