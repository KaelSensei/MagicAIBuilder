/**
 * Seed for the account export tests: three players and a row in every table
 * an account owns, credentials included, for `src/test/in-memory-prisma-tables.ts`.
 *
 * Identity context. `PLAYER` owns a row in every archive section. `RIVAL`
 * owns rows of the same kinds, some of them on the player's deck (a rating, a
 * comment), so an export that reads by the wrong column shows them. `FAN`
 * follows the player and has an email, which the export must not carry.
 * Every credential column holds a value from {@link SECRETS}, so a test can
 * check that none of them reaches the archive.
 *
 * @module test/account-export-seed
 */
import type { InMemoryTables, TableRow } from "@/test/in-memory-prisma-tables";

/** The player who exports. */
export const PLAYER = "player-1";
/** Another player with rows of every kind. */
export const RIVAL = "player-2";
/** A player who follows {@link PLAYER}. */
export const FAN = "player-3";

/** The email of {@link FAN}, which no follower entry may carry. */
export const FAN_EMAIL = "fan@example.test";

/** Every credential value the seed stores, by where it is stored. */
export const SECRETS = {
  passwordHash: "$2b$12$player-password-hash",
  oauthAccessToken: "oauth-access-token-value",
  oauthRefreshToken: "oauth-refresh-token-value",
  oauthIdToken: "oauth-id-token-value",
  sessionToken: "session-token-value",
  apiKeyHash: "api-key-sha256-value",
  apiKeyPrefix: "mab_a1b2c3d4",
  shareToken: "deck-share-token-value",
} as const;

const AT = new Date("2026-10-01T09:00:00.000Z");
const dates = { createdAt: AT, updatedAt: AT };

function userRow(id: string, username: string, email: string): TableRow {
  return {
    id,
    name: `Name of ${username}`,
    username,
    onboardingDone: true,
    email,
    emailVerified: AT,
    image: null,
    password: id === PLAYER ? SECRETS.passwordHash : null,
    isModerator: false,
    ...dates,
  };
}

function deckRow(id: string, userId: string, name: string): TableRow {
  return {
    id,
    name,
    description: "",
    tags: ["superfriends"],
    format: "commander",
    targetBracket: 3,
    budget: null,
    commanderId: null,
    commanderName: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    manualBracket: null,
    shareToken: userId === PLAYER ? SECRETS.shareToken : null,
    shareEnabled: userId === PLAYER,
    isPublic: true,
    seekingFeedback: false,
    feedbackQuestion: null,
    isAIGenerated: false,
    forkedFromDeckId: null,
    forkedFromDeckName: null,
    forkedFromUserName: null,
    userId,
    folderId: userId === PLAYER ? "folder-mine" : null,
    idempotencyKey: null,
    version: 0,
    ...dates,
  };
}

function deckCardRow(
  deckId: string,
  name: string,
  overrides: Readonly<Record<string, unknown>> = {}
): TableRow {
  return {
    id: `${deckId}-${name}`,
    deckId,
    scryfallId: `printing-${name}`,
    name,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    power: null,
    toughness: null,
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    notes: null,
    zone: "main",
    ...overrides,
  };
}

function collectionRow(userId: string, name: string): TableRow {
  return {
    id: `${userId}-${name}`,
    scryfallId: `printing-${name}`,
    name,
    quantity: 1,
    foil: false,
    condition: "NM",
    acquiredAt: null,
    price: null,
    imageUri: "",
    userId,
    createdAt: AT,
  };
}

/** The players, their credentials and their decks. */
function seedAccountsAndDecks(tables: InMemoryTables): void {
  tables.set("user", [
    userRow(PLAYER, "kael", "kael@example.test"),
    userRow(RIVAL, "rival", "rival@example.test"),
    userRow(FAN, "fan", FAN_EMAIL),
  ]);
  tables.set("account", [
    {
      id: "account-1",
      userId: PLAYER,
      type: "oauth",
      provider: "google",
      providerAccountId: "google-1",
      access_token: SECRETS.oauthAccessToken,
      refresh_token: SECRETS.oauthRefreshToken,
      id_token: SECRETS.oauthIdToken,
    },
  ]);
  tables.set("session", [
    {
      id: "session-1",
      sessionToken: SECRETS.sessionToken,
      userId: PLAYER,
      expires: AT,
    },
  ]);
  tables.set("deck", [
    deckRow("deck-mine", PLAYER, "Atraxa superfriends"),
    deckRow("deck-theirs", RIVAL, "Rival's secret deck"),
  ]);
  tables.set("deckCard", [
    deckCardRow("deck-mine", "Atraxa, Praetors' Voice", {
      isCommander: true,
      category: "commander",
    }),
    deckCardRow("deck-mine", "Sol Ring", { notes: "Turn one, always" }),
    deckCardRow("deck-theirs", "Mana Crypt"),
  ]);
  tables.set("deckSnapshot", [
    {
      id: "snapshot-mine",
      deckId: "deck-mine",
      name: "Before the cut",
      cardList: [{ name: "Sol Ring" }],
      commander: "Atraxa, Praetors' Voice",
      cardCount: 2,
      createdAt: AT,
    },
    {
      id: "snapshot-theirs",
      deckId: "deck-theirs",
      name: "Rival snapshot",
      cardList: [],
      commander: null,
      cardCount: 1,
      createdAt: AT,
    },
  ]);
  tables.set("deckFolder", [
    {
      id: "folder-mine",
      userId: PLAYER,
      name: "Superfriends folder",
      ...dates,
    },
    { id: "folder-theirs", userId: RIVAL, name: "Rival folder", ...dates },
  ]);
}

/** The collection, packages and plans. */
function seedCollectionAndPackages(tables: InMemoryTables): void {
  tables.set("collectionCard", [
    collectionRow(PLAYER, "Arcane Signet"),
    collectionRow(RIVAL, "Jeweled Lotus"),
  ]);
  tables.set("acquisitionIntent", [
    {
      id: "intent-1",
      userId: PLAYER,
      deckId: "deck-mine",
      scryfallId: "printing-Sol Ring",
      mode: "buy",
      ...dates,
    },
  ]);
  tables.set("cardPackage", [
    {
      id: "package-mine",
      authorId: PLAYER,
      name: "My mana base",
      description: "",
      category: "mana",
      isPublic: false,
      ...dates,
    },
    {
      id: "package-theirs",
      authorId: RIVAL,
      name: "Rival package",
      description: "",
      category: "other",
      isPublic: true,
      ...dates,
    },
  ]);
  tables.set("cardPackageCard", [
    {
      id: "pc-1",
      packageId: "package-mine",
      scryfallId: "printing-Command Tower",
      name: "Command Tower",
      quantity: 1,
      colorIdentity: [],
      isBanned: false,
      isBasicLand: false,
      imageUri: "",
    },
    {
      id: "pc-2",
      packageId: "package-theirs",
      scryfallId: "printing-Rival land",
      name: "Rival land",
      quantity: 1,
      colorIdentity: [],
      isBanned: false,
      isBasicLand: false,
      imageUri: "",
    },
  ]);
}

/** Ratings, votes, comments, playtests, follows, bookmarks and reports. */
function seedCommunity(tables: InMemoryTables): void {
  tables.set("deckRating", [
    {
      id: "rating-1",
      deckId: "deck-theirs",
      userId: PLAYER,
      rating: 4,
      title: "Solid",
      body: "Fun to play against",
      helpfulCount: 2,
      ...dates,
    },
    {
      id: "rating-2",
      deckId: "deck-mine",
      userId: RIVAL,
      rating: 1,
      title: "Rival review",
      body: "Rival review body",
      helpfulCount: 0,
      ...dates,
    },
  ]);
  tables.set("deckVote", [
    { id: "vote-1", deckId: "deck-theirs", userId: PLAYER, value: 1, ...dates },
    { id: "vote-2", deckId: "deck-mine", userId: RIVAL, value: -1, ...dates },
  ]);
  tables.set("deckComment", [
    {
      id: "comment-1",
      deckId: "deck-theirs",
      userId: PLAYER,
      parentId: null,
      body: "Nice list",
      ...dates,
    },
    {
      id: "comment-2",
      deckId: "deck-mine",
      userId: RIVAL,
      parentId: null,
      body: "Rival comment on your deck",
      ...dates,
    },
  ]);
  tables.set("playtestSession", [
    {
      id: "playtest-1",
      deckId: "deck-mine",
      userId: PLAYER,
      result: "win",
      turns: 7,
      mulliganCount: 0,
      difficulty: null,
      notes: null,
      proposedChange: null,
      snapshotId: null,
      cardsSeen: 14,
      additionalCardsSeen: 0,
      createdAt: AT,
    },
  ]);
  tables.set("userFollow", [
    { id: "follow-1", followerId: PLAYER, followingId: RIVAL, createdAt: AT },
    { id: "follow-2", followerId: FAN, followingId: PLAYER, createdAt: AT },
    { id: "follow-3", followerId: FAN, followingId: RIVAL, createdAt: AT },
  ]);
  tables.set("publicDeckFolder", [
    {
      id: "public-folder-mine",
      userId: PLAYER,
      name: "Decks to try",
      ...dates,
    },
  ]);
  tables.set("savedPublicDeck", [
    {
      id: "saved-1",
      userId: PLAYER,
      deckId: "deck-theirs",
      folderId: "public-folder-mine",
      ...dates,
    },
  ]);
  tables.set("deckReport", [
    {
      id: "report-1",
      userId: PLAYER,
      deckId: "deck-theirs",
      reason: "spam",
      status: "pending",
      reviewedById: null,
      reviewedAt: null,
      ...dates,
    },
  ]);
}

/** Settings, API keys and AI usage. */
function seedSettingsAndUsage(tables: InMemoryTables): void {
  tables.set("notificationPreference", [
    {
      id: "prefs-1",
      userId: PLAYER,
      replies: true,
      mentions: false,
      follows: true,
      watchedDecks: true,
      ...dates,
    },
  ]);
  tables.set("apiKey", [
    {
      id: "key-1",
      name: "CLI on my laptop",
      tokenHash: SECRETS.apiKeyHash,
      displayPrefix: SECRETS.apiKeyPrefix,
      scopes: ["decks:read"],
      revokedAt: null,
      expiresAt: null,
      lastUsedAt: null,
      userId: PLAYER,
      createdAt: AT,
    },
  ]);
  tables.set("usageCounter", [
    { userId: PLAYER, key: "ai.build", periodStart: AT, used: 3 },
    { userId: RIVAL, key: "ai.build", periodStart: AT, used: 99 },
  ]);
  tables.set("aiUsage", [
    {
      id: "usage-1",
      userId: PLAYER,
      route: "build",
      provider: "anthropic",
      model: "claude",
      inputTokens: 10,
      outputTokens: 20,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      stopReason: "end_turn",
      outcome: "ok",
      costMicroUsd: 42,
      priceTableVersion: "v1",
      countsAgainstAllowance: true,
      createdAt: AT,
    },
  ]);
}

/**
 * Replaces every table with the three players' rows.
 *
 * @param tables - The in-memory database the test's Prisma fake reads.
 */
export function seedAccounts(tables: InMemoryTables): void {
  tables.clear();
  seedAccountsAndDecks(tables);
  seedCollectionAndPackages(tables);
  seedCommunity(tables);
  seedSettingsAndUsage(tables);
}
